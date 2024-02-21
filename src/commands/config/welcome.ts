import welcomeMessageSchema from "../../models/welcome-message.schema";
import { SchemaWelcomeMessage } from "../../types";
import { welcomeEmbed, welcomeOptionsEmbed } from "../../utils/embed";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  RoleSelectMenuBuilder,
  SlashCommandBuilder,
} from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Configure les messages de bienvenue.")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const welcomeConfig: SchemaWelcomeMessage =
      await welcomeMessageSchema.findOneAndUpdate(
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
        .setCustomId("welcomeMessageEdit")
        .setLabel("Modifier")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("welcomeMessageUserPing")
        .setLabel("Ping")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("welcomeMessageVariables")
        .setLabel("Variables")
        .setStyle(ButtonStyle.Secondary),
    );

    const secondActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("welcomeMessageConfirm")
        .setLabel("Confirmer")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("welcomeMessageCancel")
        .setLabel("Annuler")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("welcomeMessageReset")
        .setLabel("Reset")
        .setStyle(ButtonStyle.Danger),
    );

    const thirdActionRow =
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        new ChannelSelectMenuBuilder()
          .setChannelTypes(ChannelType.GuildText)
          .setCustomId("welcomeMessageChannelSelect")
          .setPlaceholder("Ajouter ou supprimer des salons de bienvenue")
          .setMinValues(0)
          .setMaxValues(6),
      );

    const forthActionRow =
      new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId("welcomeMessageRoleSelect")
          .setPlaceholder("Ajouter ou supprimer des rôles de bienvenue")
          .setMinValues(0)
          .setMaxValues(6),
      );

    await interaction.editReply({
      content: welcomeConfig.ping_user ? interaction.user.toString() : "",
      embeds: [
        welcomeEmbed(
          welcomeConfig.hex_color,
          welcomeConfig.message,
          interaction,
        ),
        welcomeOptionsEmbed(welcomeConfig),
      ],
      components: [
        firstActionRow,
        secondActionRow,
        thirdActionRow,
        forthActionRow,
      ],
    });
  },
};
