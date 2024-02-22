import welcomeMessageSchema from "../models/welcome-message.schema";
import { SchemaWelcomeMessage } from "../types";
import { colorNameOrHexToRGB } from "../utils/colors";
import {
  errorEmbed,
  successEmbed,
  welcomeEmbed,
  welcomeOptionsEmbed,
} from "../utils/embed";
import { getVariable } from "../utils/variable";
import {
  ActionRowBuilder,
  Events,
  Interaction,
  MessageComponentInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (
      !interaction.isButton() &&
      !interaction.isAnySelectMenu() &&
      !interaction.isModalSubmit()
    )
      return;
    if (!interaction.guild || !interaction.channel) return;

    const [type, userId] = interaction.customId.split("-");
    const types = [
      "welcomeMessageEdit",
      "welcomeMessageUserPing",
      "welcomeMessageVariables",
      "welcomeMessageClose",
      "welcomeMessageReset",
      "welcomeMessageChannelSelect",
      "welcomeMessageRoleSelect",
    ];
    if (!types.includes(type)) return;

    if (userId !== interaction.user.id) {
      return interaction.reply({
        embeds: [
          errorEmbed("Vous n'avez pas la permission de modifier ce message."),
        ],
        ephemeral: true,
      });
    }

    const editWelcomeConfig = async (
      interaction: Interaction,
      fields: Partial<SchemaWelcomeMessage>,
    ): Promise<SchemaWelcomeMessage> => {
      return await welcomeMessageSchema.findOneAndUpdate(
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

    const editWelcomeMessage = async (
      interaction: MessageComponentInteraction | ModalSubmitInteraction,
      welcomeConfig: SchemaWelcomeMessage,
    ): Promise<void> => {
      try {
        await interaction.message?.edit({
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
        });
      } catch (error) {
        await interaction.editReply({
          embeds: [
            errorEmbed("Une erreur est survenue lors de la mise à jour."),
          ],
        });
      }
    };

    const welcomeConfig = await editWelcomeConfig(interaction, {});

    if (type === "welcomeMessageEdit") {
      if (interaction.isButton()) {
        const modal = new ModalBuilder()
          .setCustomId(`welcomeMessageEdit-${interaction.user.id}`)
          .setTitle("Modifiez le message de bienvenue");

        const hex_color = new TextInputBuilder()
          .setCustomId("hex_color")
          .setLabel("Couleur (e.g. #FF0000 | red | 255, 0, 0)")
          .setValue(`${welcomeConfig.hex_color}`)
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const message = new TextInputBuilder()
          .setCustomId("message")
          .setLabel("Votre message, avec les variables")
          .setValue(`${welcomeConfig.message}`)
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(2000)
          .setRequired(true);

        const rows = [hex_color, message].map((field) =>
          new ActionRowBuilder<TextInputBuilder>().addComponents(field),
        );

        modal.addComponents(...rows);

        await interaction.showModal(modal);
      } else if (interaction.isModalSubmit()) {
        await interaction.deferReply({ ephemeral: true });

        const hex_color_string =
          interaction.fields.getTextInputValue("hex_color");
        const message = interaction.fields.getTextInputValue("message");
        let hex_color: [number, number, number];

        try {
          hex_color = colorNameOrHexToRGB(hex_color_string);
        } catch (error) {
          return interaction.editReply({
            embeds: [errorEmbed("Le code couleur n'est pas valide.")],
          });
        }

        welcomeConfig.hex_color = hex_color;
        welcomeConfig.message = message;

        await editWelcomeConfig(interaction, welcomeConfig);
        await editWelcomeMessage(interaction, welcomeConfig);

        await interaction.editReply({
          embeds: [successEmbed("Le message de bienvenue a été mis à jour.")],
        });
      }
    } else if (type === "welcomeMessageUserPing") {
      await interaction.deferReply({ ephemeral: true });

      welcomeConfig.ping_user = !welcomeConfig.ping_user;
      await editWelcomeConfig(interaction, welcomeConfig);
      await editWelcomeMessage(interaction, welcomeConfig);

      await interaction.editReply({
        embeds: [
          successEmbed(
            `La mention de l'utilisateur a été ${
              welcomeConfig.ping_user ? "activée" : "désactivée"
            }.`,
          ),
        ],
      });
    } else if (type === "welcomeMessageVariables") {
      await interaction.reply({
        content: getVariable().join("\n"),
        ephemeral: true,
      });
    } else if (type === "welcomeMessageReset") {
      await interaction.deferReply({ ephemeral: true });

      welcomeConfig.hex_color = [87, 242, 135];
      welcomeConfig.message = `Bienvenue sur **{server}**, {user.mention} !`;
      welcomeConfig.channel_ids = [];
      welcomeConfig.role_ids = [];
      welcomeConfig.ping_user = false;

      await editWelcomeConfig(interaction, welcomeConfig);
      await editWelcomeMessage(interaction, welcomeConfig);

      await interaction.editReply({
        embeds: [successEmbed("Le message de bienvenue a été réinitialisé.")],
      });
    } else if (type === "welcomeMessageClose") {
      await interaction.deferReply({ ephemeral: true });
      await interaction.deleteReply();
      await interaction.message?.delete().catch(() => null);
    } else if (type === "welcomeMessageChannelSelect") {
      if (!interaction.isChannelSelectMenu()) return;

      await interaction.deferReply({ ephemeral: true });

      welcomeConfig.channel_ids = interaction.values;

      await editWelcomeConfig(interaction, welcomeConfig);
      await editWelcomeMessage(interaction, welcomeConfig);

      await interaction.editReply({
        embeds: [successEmbed("Les salons de bienvenue ont été mis à jour.")],
      });
    } else if (type === "welcomeMessageRoleSelect") {
      if (!interaction.isRoleSelectMenu()) return;

      await interaction.deferReply({ ephemeral: true });

      welcomeConfig.role_ids = interaction.values;

      await editWelcomeConfig(interaction, welcomeConfig);
      await editWelcomeMessage(interaction, welcomeConfig);

      await interaction.editReply({
        embeds: [successEmbed("Les rôles de bienvenue ont été mis à jour.")],
      });
    }
  },
};
