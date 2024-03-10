import pollSchema from "../../models/poll.schema";
import { PollChoice } from "../../types";
import {
  createProgressBar,
  errorEmbed,
  pollEmbed,
  successEmbed,
} from "../../utils/embed";
import { Emojis } from "../../utils/emojis";
import { formatTime } from "../../utils/time";
import dayjs from "dayjs";
import {
  ActionRowBuilder,
  AutocompleteInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  GuildTextBasedChannel,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

const defaultID = "Aucun sondage trouvé.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("polls")
    .setDescription("Configure les sondages.")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand.setName("create").setDescription("Crée un sondage."),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("end")
        .setDescription("Termine un sondage.")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("ID du sondage à terminer.")
            .setRequired(true)
            .setAutocomplete(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Supprime un sondage.")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("ID du sondage à supprimer.")
            .setRequired(true)
            .setAutocomplete(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("Liste les sondages.")
        .addStringOption((option) =>
          option
            .setName("status")
            .setDescription("Statut du sondage.")
            .setRequired(false)
            .addChoices(
              { name: "Tous", value: "tous" },
              { name: "En cours", value: "en_cours" },
              { name: "Terminé", value: "termine" },
            ),
        )
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("ID du sondage.")
            .setRequired(false)
            .setAutocomplete(true),
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Salon où le sondage a été créé.")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        )
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Utilisateur ayant créé le sondage.")
            .setRequired(false),
        ),
    ),
  async autocomplete(interaction: AutocompleteInteraction) {
    const polls = await pollSchema.find({
      guild_id: interaction.guildId,
    });

    if (polls.length <= 0)
      return await interaction.respond([{ name: defaultID, value: defaultID }]);

    return await interaction.respond(
      polls.map((poll) => ({ name: poll._id, value: poll._id })),
    );
  },
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommands = interaction.options.getSubcommand();

    switch (subcommands) {
      case "create":
        {
          const pollLimit = 10;
          const pollCount = await pollSchema.countDocuments({
            guild_id: interaction.guildId,
          });

          if (pollCount >= pollLimit)
            return await interaction.reply({
              embeds: [
                errorEmbed(
                  `Vous avez atteint la limite de sondages (${pollLimit}).`,
                ),
              ],
              ephemeral: true,
            });

          const date = formatTime(dayjs().add(1, "hour").toDate());

          const modal = new ModalBuilder()
            .setCustomId(`pollCreate-${interaction.user.id}`)
            .setTitle("Créer un sondage");

          const question = new TextInputBuilder()
            .setCustomId("question")
            .setLabel("Question (Requis)")
            .setPlaceholder("Quelle est votre question ?")
            .setMaxLength(256)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

          const duration = new TextInputBuilder()
            .setCustomId("duration")
            .setLabel("Durée (Optionnel)")
            .setPlaceholder(`e.g ${date.small}`)
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

          const firstChoice = new TextInputBuilder()
            .setCustomId("firstChoice")
            .setLabel("Premier choix (Requis)")
            .setPlaceholder("Premier choix")
            .setMaxLength(50)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const secondChoice = new TextInputBuilder()
            .setCustomId("secondChoice")
            .setLabel("Deuxième choix (Requis)")
            .setPlaceholder("Deuxième choix")
            .setMaxLength(50)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const otherChoices = new TextInputBuilder()
            .setCustomId("otherChoices")
            .setLabel("Autres choix (Optionnel)")
            .setPlaceholder("Autres choix, un par ligne. (max 18)")
            .setMaxLength(800)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

          const rows = [
            question,
            duration,
            firstChoice,
            secondChoice,
            otherChoices,
          ].map((field) =>
            new ActionRowBuilder<TextInputBuilder>().addComponents(field),
          );

          modal.addComponents(...rows);

          await interaction.showModal(modal);
        }
        break;
      case "end":
        {
          await interaction.deferReply({ ephemeral: true });
          const id = interaction.options.getString("id");

          if (id === defaultID)
            return await interaction.editReply({
              embeds: [errorEmbed("Veuillez à bien sélectionner un sondage.")],
            });

          const poll = await pollSchema.findOne({
            _id: id,
            guild_id: interaction.guildId,
          });

          if (!poll)
            return await interaction.editReply({
              embeds: [errorEmbed("Aucun sondage trouvé avec cet ID.")],
            });

          if (poll.closed_at) {
            return await interaction.editReply({
              embeds: [errorEmbed("Ce sondage est déjà terminé.")],
            });
          }

          poll.closed_at = new Date();

          const channel = interaction.guild?.channels.cache.get(
            poll.channel_id,
          ) as GuildTextBasedChannel;
          const message = await channel?.messages.fetch(poll._id);

          const totalVotes = poll.choices.reduce(
            (acc: number, choice: PollChoice) => acc + choice.voters.length,
            0,
          );
          const resultString = poll.choices
            .map((choice: PollChoice) => {
              return `${choice.emoji} - ${createProgressBar(choice.voters.length, totalVotes)} ${choice.voters.length} votes`;
            })
            .join("\n");

          if (message) {
            await message.edit({ embeds: [pollEmbed(poll)], components: [] });
            const resultMessage = await message.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor(Colors.Blurple)
                  .setTitle("Résultats")
                  .setURL(message.url)
                  .setDescription(resultString),
              ],
            });
            poll.result_message_id = resultMessage.id;
          }

          await poll.save();

          await interaction.editReply({
            embeds: [
              successEmbed(
                `Le sondage \`${poll._id}\` a été terminé avec succès.`,
              ),
            ],
          });
        }
        break;
      case "delete":
        {
          await interaction.deferReply({ ephemeral: true });
          const id = interaction.options.getString("id");

          if (id === defaultID)
            return await interaction.editReply({
              embeds: [errorEmbed("Veuillez à bien sélectionner un sondage.")],
            });

          const poll = await pollSchema.findOneAndDelete({
            _id: id,
            guild_id: interaction.guildId,
          });

          if (!poll)
            return await interaction.editReply({
              embeds: [errorEmbed("Aucun sondage trouvé avec cet ID.")],
            });

          const channel = interaction.guild?.channels.cache.get(
            poll.channel_id,
          ) as GuildTextBasedChannel;

          try {
            const message = await channel.messages.fetch(poll._id);
            await message.delete();
          } catch (ignored) {}

          try {
            const message = await channel.messages.fetch(
              poll.result_message_id,
            );
            await message.delete();
          } catch (ignored) {}

          await interaction.editReply({
            embeds: [successEmbed("Sondage supprimé avec succès.")],
          });
        }
        break;
      case "list":
        {
          await interaction.deferReply({ ephemeral: true });

          const status = interaction.options.getString("status");
          const id = interaction.options.getString("id");
          const channel = interaction.options.getChannel("channel");
          const user = interaction.options.getUser("user");

          const filter = {
            guild_id: interaction.guildId,
            ...(status &&
              status !== "tous" && {
                closed_at:
                  status === "termine" ? { $ne: undefined } : undefined,
              }),
            ...(id && { _id: id }),
            ...(channel && { channel_id: channel.id }),
            ...(user && { creator_id: user.id }),
          };

          const polls = await pollSchema
            .find(filter)
            .limit(25)
            .sort("-created_at");

          if (polls.length <= 0)
            return await interaction.editReply({
              embeds: [errorEmbed("Aucun sondage trouvé.")],
            });

          if (id) {
            const poll = polls[0];
            return await interaction.editReply({
              embeds: [pollEmbed(poll, true)],
            });
          }

          const options = polls.map((poll) => ({
            label: poll._id,
            value: poll._id,
            emoji: poll.closed_at ? Emojis.lock : Emojis.key,
          }));

          const firstRow =
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId(`pollList-${interaction.user.id}`)
                .setPlaceholder(
                  "Sélectionnez un sondage pour plus d'informations.",
                )
                .addOptions(options),
            );

          await interaction.editReply({
            content: "Sélectionnez un sondage pour plus d'informations.",
            components: [firstRow],
          });
        }
        break;
    }
  },
};
