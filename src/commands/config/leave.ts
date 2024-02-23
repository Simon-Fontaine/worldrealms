import leaveMessageSchema from "../../models/leave-message.schema";
import { SchemaLeaveMessage } from "../../types";
import { leaveOptionsEmbed, variableEmbed } from "../../utils/embed";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Configure les messages de départ.")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const leaveConfig: SchemaLeaveMessage =
      await leaveMessageSchema.findOneAndUpdate(
        {
          _id: interaction.guildId,
        },
        {
          _id: interaction.guildId,
        },
        {
          upsert: true,
          new: true,
        },
      );

    const firstActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`leaveMessageModal-${interaction.user.id}`)
        .setLabel("Modifier")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`leaveMessageVariables-${interaction.user.id}`)
        .setLabel("Variables")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`leaveMessageClose-${interaction.user.id}`)
        .setLabel("Fermer")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`leaveMessageReset-${interaction.user.id}`)
        .setLabel("Réinitialiser")
        .setStyle(ButtonStyle.Danger),
    );

    const secondActionRow =
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        new ChannelSelectMenuBuilder()
          .setChannelTypes(ChannelType.GuildText)
          .setCustomId(`leaveMessageChannelSelect-${interaction.user.id}`)
          .setPlaceholder("Ajouter ou supprimer des salons de départ")
          .setMinValues(0)
          .setMaxValues(6),
      );

    await interaction.editReply({
      embeds: [
        variableEmbed(
          leaveConfig.hex_color,
          leaveConfig.message,
          interaction.guild!,
          interaction.user,
        ),
        leaveOptionsEmbed(leaveConfig),
      ],
      components: [firstActionRow, secondActionRow],
    });
  },
};
