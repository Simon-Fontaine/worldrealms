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
  resolveColor,
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
    await interaction.deferReply();

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
        .setCustomId(`welcomeMessageEdit-${interaction.user.id}`)
        .setLabel("Modifier")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`welcomeMessageUserPing-${interaction.user.id}`)
        .setLabel("Mention Utilisateur")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`welcomeMessageVariables-${interaction.user.id}`)
        .setLabel("Variables")
        .setStyle(ButtonStyle.Secondary),
    );

    const secondActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`welcomeMessageClose-${interaction.user.id}`)
        .setLabel("Fermer")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`welcomeMessageReset-${interaction.user.id}`)
        .setLabel("Réinitialiser")
        .setStyle(ButtonStyle.Danger),
    );

    const thirdActionRow =
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        new ChannelSelectMenuBuilder()
          .setChannelTypes(ChannelType.GuildText)
          .setCustomId(`welcomeMessageChannelSelect-${interaction.user.id}`)
          .setPlaceholder("Ajouter ou supprimer des salons de bienvenue")
          .setMinValues(0)
          .setMaxValues(6),
      );

    const forthActionRow =
      new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(`welcomeMessageRoleSelect-${interaction.user.id}`)
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
          interaction.guild!,
          interaction.user,
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
