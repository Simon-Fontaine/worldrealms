import pollSchema from "../../models/poll.schema";
import { Poll, PollChoice } from "../../types";
import { errorEmbed, pollEmbed, successEmbed } from "../../utils/embed";
import { Emojis, Letters } from "../../utils/emojis";
import { splitAndTrim } from "../../utils/strings";
import { formatTime } from "../../utils/time";
import { cleanUsername } from "../../utils/user";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  GuildMemberRoleManager,
  ModalSubmitInteraction,
  RoleSelectMenuBuilder,
  RoleSelectMenuInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  User,
} from "discord.js";

export async function pollCreate(interaction: ModalSubmitInteraction) {
  await interaction.deferUpdate();
  const message = await interaction.channel!.send({ content: Emojis.loading });

  const question = interaction.fields.getTextInputValue("question");
  const duration = interaction.fields.getTextInputValue("duration");
  const firstChoice = interaction.fields.getTextInputValue("firstChoice");
  const secondChoice = interaction.fields.getTextInputValue("secondChoice");
  const otherChoices = interaction.fields.getTextInputValue("otherChoices");
  const choices = [firstChoice, secondChoice, ...splitAndTrim(otherChoices)];

  if (choices.length < 2 || choices.length > 20)
    return await message.edit({
      content: null,
      embeds: [
        errorEmbed("Le nombre de choix doit être compris entre 2 et 20."),
      ],
    });

  let dateDuration: Date | undefined = undefined;

  if (duration) {
    try {
      dateDuration = formatTime(duration).date;
      if (dateDuration < new Date())
        return await message.edit({
          content: null,
          embeds: [errorEmbed("La durée ne peut pas être dans le passé.")],
        });
    } catch {
      return await message.edit({
        content: null,
        embeds: [errorEmbed(`La durée \`${duration}\` est invalide.`)],
      });
    }
  }

  const poll: Poll = {
    _id: message.id,
    guild_id: interaction.guildId!,
    channel_id: interaction.channelId!,
    result_message_id: undefined,
    creator_id: interaction.user.id,
    creator_username: cleanUsername(interaction.user),
    question,
    choices: choices.map((choice, index) => ({
      choice,
      emoji: Letters[index],
      voters: [],
    })),
    allowed_roles: [],
    max_choices: undefined,
    created_at: new Date(),
    closed_at: undefined,
    expires_at: dateDuration,
  };

  await pollSchema.create(poll);

  const firstRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`pollConfirm-${interaction.user.id}`)
      .setLabel("Confirmer")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`pollCancel-${interaction.user.id}`)
      .setLabel("Annuler")
      .setStyle(ButtonStyle.Danger),
  );

  const secondRow = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
    new RoleSelectMenuBuilder()
      .setCustomId(`pollAllowedRoles-${interaction.user.id}`)
      .setPlaceholder(
        "Ajouter/supprimer les rôles qui peuvent voter pour ce sondage",
      )
      .setMinValues(0)
      .setMaxValues(25),
  );

  const options = choices.map((choice, index) => ({
    label: `${index + 1}`,
    value: `${index + 1}`,
  }));

  options.push({
    label: "Aucune limite",
    value: "0",
  });

  const thirdRow =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`pollMaxChoices-${interaction.user.id}`)
        .setPlaceholder(
          "Limiter le nombre de choix qu'un membre peut sélectionner",
        )
        .addOptions(options),
    );

  await message.edit({
    content: [
      "👀 **Voici un aperçu de votre sondage !**",
      "",
      "Cliquez sur le bouton **`Confirmer`** pour créer votre sondage ici.",
    ].join("\n"),
    embeds: [pollEmbed(poll)],
    components: [firstRow, secondRow, thirdRow],
  });
}

export async function pollConfirm(interaction: ButtonInteraction) {
  await interaction.deferUpdate();
  const poll = (await pollSchema.findOne({
    _id: interaction.message.id,
    guild_id: interaction.guildId,
  })) as Poll | null;

  if (!poll)
    return await interaction.editReply({
      embeds: [errorEmbed("Ce sondage n'existe plus.")],
    });

  const buttons = poll.choices.map((choice, index) =>
    new ButtonBuilder()
      .setCustomId(`pollVote-${index}`)
      .setEmoji(choice.emoji)
      .setStyle(ButtonStyle.Secondary),
  );

  const rows = new Array<ActionRowBuilder<ButtonBuilder>>();
  let currentRow = new ActionRowBuilder<ButtonBuilder>();

  buttons.map((button, index) => {
    if (index % 5 === 0) {
      currentRow = new ActionRowBuilder<ButtonBuilder>();
      rows.push(currentRow);
    }

    currentRow.addComponents(button);
  });

  await interaction.editReply({
    content: null,
    embeds: [pollEmbed(poll)],
    components: rows,
  });
}

export async function pollCancel(interaction: ButtonInteraction) {
  await interaction.deferUpdate();
  await pollSchema.deleteOne({
    _id: interaction.message.id,
    guild_id: interaction.guildId,
  });
  await interaction.message.delete();
}

export async function pollAllowedRoles(interaction: RoleSelectMenuInteraction) {
  await interaction.deferUpdate();
  const poll = await pollSchema.findOne({
    _id: interaction.message.id,
    guild_id: interaction.guildId,
  });

  if (!poll)
    return await interaction.editReply({
      embeds: [errorEmbed("Ce sondage n'existe plus.")],
    });

  poll.allowed_roles = interaction.values;
  await poll.save();

  await interaction.editReply({
    embeds: [pollEmbed(poll)],
  });
}

export async function pollMaxChoices(interaction: StringSelectMenuInteraction) {
  await interaction.deferUpdate();
  const poll = await pollSchema.findOne({
    _id: interaction.message.id,
    guild_id: interaction.guildId,
  });

  if (!poll)
    return await interaction.editReply({
      embeds: [errorEmbed("Ce sondage n'existe plus.")],
    });

  poll.max_choices =
    interaction.values[0] === "0" ? undefined : +interaction.values[0];
  await poll.save();

  await interaction.editReply({
    embeds: [pollEmbed(poll)],
  });
}

export async function pollVote(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const poll = await pollSchema.findOne({
    _id: interaction.message.id,
    guild_id: interaction.guildId,
  });

  if (!poll)
    return await interaction.editReply({
      embeds: [errorEmbed("Ce sondage n'existe plus.")],
    });

  if (poll.closed_at)
    return await interaction.editReply({
      embeds: [
        errorEmbed("Ce sondage est terminé. Il est trop tard pour voter."),
      ],
    });

  if (poll.expires_at && poll.expires_at < new Date())
    return await interaction.editReply({
      embeds: [errorEmbed("Ce sondage a expiré. Il est trop tard pour voter.")],
    });

  const roles = interaction.member?.roles as GuildMemberRoleManager;

  if (
    poll.allowed_roles.length &&
    !roles.cache.some((role) => poll.allowed_roles.includes(role.id))
  )
    return await interaction.editReply({
      embeds: [
        errorEmbed(
          `Vous devez avoir l'un des rôles suivants pour voter pour ce choix :\n${poll.allowed_roles.map((role: string) => `<@&${role}>`).join(", ")}`,
        ),
      ],
    });

  const choiceIndex = +interaction.customId.split("-")[1];
  const choice = poll.choices[choiceIndex];

  function getCurrentVotes(choices: PollChoice[], user: User) {
    const selectedChoices = choices.filter((choice) =>
      choice.voters.includes(user.id),
    );
    return (
      selectedChoices.map((choice) => choice.emoji).join(", ") || "**Aucun**"
    );
  }

  if (choice.voters.includes(interaction.user.id)) {
    choice.voters = choice.voters.filter(
      (voter: string) => voter !== interaction.user.id,
    );

    poll.choices[choiceIndex] = choice;
    await poll.save();

    return await interaction.editReply({
      embeds: [
        successEmbed(
          [
            `${interaction.user}, votre vote pour le choix ${choice.emoji} a été **retiré**.`,
            "",
            `Vo(s)tre vote(s) actuel(s) : ${getCurrentVotes(poll.choices, interaction.user)}`,
          ].join("\n"),
        ),
      ],
    });
  } else {
    const userTotalVotes = poll.choices.reduce(
      (total: number, choice: PollChoice) =>
        total + (choice.voters.includes(interaction.user.id) ? 1 : 0),
      0,
    );

    if (poll.max_choices && poll.max_choices <= userTotalVotes) {
      return await interaction.editReply({
        embeds: [
          errorEmbed(
            [
              `${interaction.user}, vous avez déjà **atteint la limite** de votes pour ce sondage.`,
              "",
              `Vo(s)tre vote(s) actuel(s) : ${getCurrentVotes(poll.choices, interaction.user)}`,
            ].join("\n"),
          ),
        ],
      });
    }

    choice.voters.push(interaction.user.id);
    poll.choices[choiceIndex] = choice;
    await poll.save();

    return await interaction.editReply({
      embeds: [
        successEmbed(
          [
            `${interaction.user}, votre vote pour le choix ${choice.emoji} a été **ajouté**`,
            "",
            `Vo(s)tre vote(s) actuel(s) : ${getCurrentVotes(poll.choices, interaction.user)}`,
          ].join("\n"),
        ),
      ],
    });
  }
}

export async function pollList(interaction: StringSelectMenuInteraction) {
  await interaction.deferUpdate();

  const poll = await pollSchema.findOne({
    _id: interaction.values[0],
    guild_id: interaction.guildId,
  });

  if (!poll)
    return await interaction.editReply({
      content: null,
      embeds: [errorEmbed("Ce sondage n'existe plus.")],
    });

  await interaction.editReply({
    content: null,
    embeds: [pollEmbed(poll, true)],
  });
}
