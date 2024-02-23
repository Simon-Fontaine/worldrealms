import archiveSchema from "../../models/archive.schema";
import ticketPanelSchema from "../../models/ticket-panel.schema";
import { SchemaArchive } from "../../types";
import { archiveEmbed, errorEmbed, successEmbed } from "../../utils/embed";
import { Emojis } from "../../utils/emojis";
import {
  checkExistingRoles,
  getElevatedPermissions,
  getGlobalPermissions,
} from "../../utils/permissions";
import { cleanUsername } from "../../utils/user";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelSelectMenuInteraction,
  Colors,
  EmbedBuilder,
  Interaction,
  MessageComponentInteraction,
  ModalSubmitInteraction,
  TextChannel,
} from "discord.js";

const editArchiveConfig = async (
  interaction: Interaction,
  fields: Partial<SchemaArchive>,
): Promise<SchemaArchive> => {
  return await archiveSchema.findOneAndUpdate(
    {
      _id: interaction.guildId,
    },
    {
      _id: interaction.guildId,
      ...fields,
    },
    {
      upsert: true,
      new: true,
    },
  );
};

const editArchiveMessage = async (
  interaction: MessageComponentInteraction,
  archiveConfig: SchemaArchive,
): Promise<void> => {
  try {
    await interaction.message?.edit({
      embeds: [archiveEmbed(archiveConfig)],
    });
  } catch (error) {
    await interaction.followUp({
      embeds: [errorEmbed("Une erreur est survenue lors de la mise à jour.")],
      ephemeral: true,
    });
  }
};

const defaultStyles: { [key: string]: number } = {
  bleu: ButtonStyle.Primary,
  gris: ButtonStyle.Secondary,
  vert: ButtonStyle.Success,
  rouge: ButtonStyle.Danger,
};

export const panelArchiveModal = async (
  interaction: ModalSubmitInteraction,
) => {
  await interaction.deferReply({ ephemeral: true });

  const subject = interaction.fields.getTextInputValue("subject");
  const rawButtons = interaction.fields.getTextInputValue("buttons");
  const rawStyles = interaction.fields.getTextInputValue("styles");

  const buttons = rawButtons
    .split(",")
    .map((button) => button.trim().slice(0, 25))
    .filter((button) => button.length > 0);

  const styles = rawStyles
    .toLowerCase()
    .split(",")
    .map((style) => style.trim())
    .filter((style) => style.length > 0);

  const message = await interaction.channel!.send({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setTitle(`${Emojis.exclamation_mark} ${subject}`)
        .setDescription(
          [
            "Pour pouvoir discuter avec des membres du staff merci de **sélectionner** une option dans la **liste de boutons** ci-dessous.",
            "",
            `${Emojis.exclamation_mark_red} *Tous types d'abus de cette fonctionnalité sera sanctionable par notre équipe.*`,
          ].join("\n"),
        ),
    ],
  });

  try {
    await ticketPanelSchema.create({
      _id: message.id,
      guild_id: interaction.guildId,
      channel_id: interaction.channel!.id,
      creator_id: interaction.user.id,
      creator_username: cleanUsername(interaction.user),
    });
  } catch (error) {
    return interaction.editReply({
      embeds: [
        errorEmbed(`Une erreur est survenue lors de la création du panel.`),
      ],
    });
  }

  const components = buttons.map((button, index) => {
    const style = defaultStyles[styles[index]] || ButtonStyle.Secondary;

    return new ButtonBuilder()
      .setCustomId(`ticketOpen-${message.id}-${button}`)
      .setLabel(button)
      .setStyle(style);
  });

  const rows = new Array<ActionRowBuilder<ButtonBuilder>>();
  let currentRow = new ActionRowBuilder<ButtonBuilder>();

  components.map((component, index) => {
    if (index % 5 === 0) {
      currentRow = new ActionRowBuilder<ButtonBuilder>();
      rows.push(currentRow);
    }

    currentRow.addComponents(component);
  });

  await message.edit({ components: rows });
  await interaction.editReply({
    embeds: [successEmbed(`Panel créé avec succès. (ID: ${message.id})`)],
  });
};

export const panelArchivePermission = async (
  interaction: ButtonInteraction,
) => {
  await interaction.deferReply({ ephemeral: true });
  const archiveConfig = await editArchiveConfig(interaction, {});

  const staffChannel = interaction.guild!.channels.cache.get(
    archiveConfig.staff_channel,
  ) as TextChannel | undefined;
  const userChannel = interaction.guild!.channels.cache.get(
    archiveConfig.user_channel,
  ) as TextChannel | undefined;

  if (staffChannel) {
    const elevatedPermissions = checkExistingRoles(
      interaction,
      await getElevatedPermissions(interaction),
    );

    await staffChannel.edit({
      permissionOverwrites: elevatedPermissions,
    });
  }
  if (userChannel) {
    const globalPermissions = checkExistingRoles(
      interaction,
      await getGlobalPermissions(interaction),
    );

    await userChannel.edit({
      permissionOverwrites: globalPermissions,
    });
  }

  await interaction.editReply({
    embeds: [successEmbed("Les permissions des salons ont été mises à jour.")],
  });
};

export const panelArchiveClose = async (interaction: ButtonInteraction) => {
  await interaction.deferUpdate();
  await interaction.message?.delete().catch(() => null);
};

export const panelArchiveReset = async (interaction: ButtonInteraction) => {
  await interaction.deferUpdate();
  const archiveConfig = await editArchiveConfig(interaction, {
    staff_channel: "undefined",
    user_channel: "undefined",
  });
  await editArchiveMessage(interaction, archiveConfig);
};

export const panelArchiveUser = async (
  interaction: ChannelSelectMenuInteraction,
) => {
  await interaction.deferUpdate();
  const archiveConfig = await editArchiveConfig(interaction, {
    user_channel: interaction.values[0],
  });
  await editArchiveMessage(interaction, archiveConfig);
};

export const panelArchiveStaff = async (
  interaction: ChannelSelectMenuInteraction,
) => {
  await interaction.deferUpdate();
  const archiveConfig = await editArchiveConfig(interaction, {
    staff_channel: interaction.values[0],
  });
  await editArchiveMessage(interaction, archiveConfig);
};
