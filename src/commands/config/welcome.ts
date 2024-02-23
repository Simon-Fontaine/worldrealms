import welcomeMessageSchema from "../../models/welcome-message.schema";
import { SchemaWelcomeMessage } from "../../types";
import {
  errorEmbed,
  variableEmbed,
  welcomeOptionsEmbed,
} from "../../utils/embed";
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
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addAttachmentOption((option) =>
      option
        .setName("attachment")
        .setDescription(
          "Ajouter une image ou un gif à votre message de bienvenue.",
        )
        .setRequired(false),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const attachment = interaction.options.getAttachment("attachment");

    if (attachment && !attachment.contentType?.startsWith("image")) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            "Attention, le fichier joint doit être une image ou un gif.",
          ),
        ],
      });
    }

    const welcomeConfig: SchemaWelcomeMessage =
      await welcomeMessageSchema.findOneAndUpdate(
        {
          _id: interaction.guildId,
        },
        attachment && attachment.url
          ? {
              _id: interaction.guildId,
              attachment: attachment.url,
            }
          : {
              _id: interaction.guildId,
            },
        {
          upsert: true,
          new: true,
        },
      );

    const firstActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`welcomeMessageModal-${interaction.user.id}`)
        .setLabel("Modifier")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`welcomeMessageUserPing-${interaction.user.id}`)
        .setLabel("Mention")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`welcomeMessageVariables-${interaction.user.id}`)
        .setLabel("Variables")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`welcomeMessageClose-${interaction.user.id}`)
        .setLabel("Fermer")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`welcomeMessageReset-${interaction.user.id}`)
        .setLabel("Réinitialiser")
        .setStyle(ButtonStyle.Danger),
    );

    const secondActionRow =
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        new ChannelSelectMenuBuilder()
          .setChannelTypes(ChannelType.GuildText)
          .setCustomId(`welcomeMessageChannelSelect-${interaction.user.id}`)
          .setPlaceholder("Ajouter ou supprimer des salons de bienvenue")
          .setMinValues(0)
          .setMaxValues(6),
      );

    const thirdActionRow =
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
        variableEmbed(
          welcomeConfig.hex_color,
          welcomeConfig.message,
          welcomeConfig.attachment,
          interaction.guild!,
          interaction.user,
        ),
        welcomeOptionsEmbed(welcomeConfig),
      ],
      components: [firstActionRow, secondActionRow, thirdActionRow],
    });
  },
};
