import leaveMessageSchema from "../../models/leave-message.schema";
import { SchemaLeaveMessage } from "../../types";
import { checkHex, decimalToHex, hexToDecimal } from "../../utils/colors";
import {
  errorEmbed,
  leaveOptionsEmbed,
  variableEmbed,
} from "../../utils/embed";
import { getVariable } from "../../utils/variable";
import {
  ActionRowBuilder,
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  Colors,
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

export const leaveMessageModal = async (interaction: ButtonInteraction) => {
  const leaveConfig = await editLeaveConfig(interaction, {});

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
};

export const leaveMessageEdit = async (interaction: ModalSubmitInteraction) => {
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
  const leaveConfig = await editLeaveConfig(interaction, {
    hex_color: hexToDecimal(hex_color),
    message,
  });
  await editLeaveMessage(interaction, leaveConfig);
};

export const leaveMessageVariables = async (interaction: ButtonInteraction) => {
  await interaction.reply({
    content: getVariable().join("\n"),
    ephemeral: true,
  });
};

export const leaveMessageReset = async (interaction: ButtonInteraction) => {
  await interaction.deferUpdate();
  const leaveConfig = await editLeaveConfig(interaction, {
    hex_color: Colors.Red,
    channel_ids: [],
    message:
      "**{user.idname}** nous à quitté, nous sommes maintenant `{server.member_count}` membres.",
  });
  await editLeaveMessage(interaction, leaveConfig);
};

export const leaveMessageClose = async (interaction: ButtonInteraction) => {
  await interaction.deferUpdate();
  await interaction.message?.delete().catch(() => null);
};

export const leaveMessageChannelSelect = async (
  interaction: ChannelSelectMenuInteraction,
) => {
  await interaction.deferUpdate();
  const leaveConfig = await editLeaveConfig(interaction, {
    channel_ids: interaction.values,
  });
  await editLeaveMessage(interaction, leaveConfig);
};
