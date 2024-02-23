import leaveMessageSchema from "../models/leave-message.schema";
import { SchemaLeaveMessage } from "../types";
import { checkHex, decimalToHex, hexToDecimal } from "../utils/colors";
import {
  errorEmbed,
  leaveOptionsEmbed,
  successEmbed,
  variableEmbed,
} from "../utils/embed";
import { getVariable } from "../utils/variable";
import {
  ActionRowBuilder,
  Colors,
  Events,
  Interaction,
  MessageComponentInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

const editLeaveConfig = async (
  interaction: Interaction,
  fields: Partial<SchemaLeaveMessage>,
): Promise<SchemaLeaveMessage> => {
  return await leaveMessageSchema.findOneAndUpdate(
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

const editLeaveMessage = async (
  interaction: MessageComponentInteraction | ModalSubmitInteraction,
  welcomeConfig: SchemaLeaveMessage,
): Promise<void> => {
  try {
    await interaction.message?.edit({
      embeds: [
        variableEmbed(
          welcomeConfig.hex_color,
          welcomeConfig.message,
          interaction.guild!,
          interaction.user,
        ),
        leaveOptionsEmbed(welcomeConfig),
      ],
    });
  } catch (error) {
    await interaction.editReply({
      embeds: [errorEmbed("Une erreur est survenue lors de la mise à jour.")],
    });
  }
};

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
      "leaveMessageEdit",
      "leaveMessageVariables",
      "leaveMessageClose",
      "leaveMessageReset",
      "leaveMessageChannelSelect",
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

    const leaveConfig = await editLeaveConfig(interaction, {});

    switch (type) {
      case "leaveMessageEdit":
        if (interaction.isButton()) {
          const modal = new ModalBuilder()
            .setCustomId(`leaveMessageEdit-${interaction.user.id}`)
            .setTitle("Modifiez le message de départ");

          const hex_color = new TextInputBuilder()
            .setCustomId("hex_color")
            .setLabel("Couleur (e.g. #00FF00)")
            .setValue(decimalToHex(leaveConfig.hex_color))
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const message = new TextInputBuilder()
            .setCustomId("message")
            .setLabel("Votre message, avec les variables")
            .setValue(leaveConfig.message)
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(2000)
            .setRequired(true);

          const rows = [hex_color, message].map((field) =>
            new ActionRowBuilder<TextInputBuilder>().addComponents(field),
          );

          modal.addComponents(...rows);

          await interaction.showModal(modal);
        } else if (interaction.isModalSubmit()) {
          await interaction.deferUpdate();

          const hex_color = interaction.fields.getTextInputValue("hex_color");
          const message = interaction.fields.getTextInputValue("message");

          if (!checkHex(hex_color)) {
            return await interaction.editReply({
              embeds: [
                errorEmbed(
                  "La couleur doit être au format hexadécimal (e.g. #00FF00).",
                ),
              ],
            });
          }

          leaveConfig.hex_color = hexToDecimal(hex_color);
          leaveConfig.message = message;

          await editLeaveConfig(interaction, leaveConfig);
          await editLeaveMessage(interaction, leaveConfig);
        }
        break;
      case "leaveMessageVariables":
        await interaction.reply({
          content: getVariable().join("\n"),
          ephemeral: true,
        });
        break;
      case "leaveMessageClose":
        await interaction.deferUpdate();
        await interaction.message?.delete().catch(() => null);
        break;
      case "leaveMessageReset":
        await interaction.deferUpdate();

        leaveConfig.message =
          "**{user.idname}** nous à quitté, nous sommes maintenant `{server.member_count}` membres.";
        leaveConfig.hex_color = Colors.Red;
        leaveConfig.channel_ids = [];

        await editLeaveConfig(interaction, leaveConfig);
        await editLeaveMessage(interaction, leaveConfig);
        break;
      case "leaveMessageChannelSelect":
        if (!interaction.isChannelSelectMenu()) return;

        await interaction.deferUpdate();

        leaveConfig.channel_ids = interaction.values;

        await editLeaveConfig(interaction, leaveConfig);
        await editLeaveMessage(interaction, leaveConfig);
        break;
    }
  },
};
