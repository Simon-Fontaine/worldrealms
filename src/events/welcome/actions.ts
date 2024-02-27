import welcomeMessageSchema from "../../models/welcome-message.schema";
import { SchemaWelcomeMessage } from "../../types";
import { checkHex, decimalToHex, hexToDecimal } from "../../utils/colors";
import {
  errorEmbed,
  variableEmbed,
  welcomeOptionsEmbed,
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
  RoleSelectMenuInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

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
        variableEmbed(
          welcomeConfig.hex_color,
          welcomeConfig.message,
          welcomeConfig.attachment,
          interaction.guild!,
          interaction.user,
        ),
        welcomeOptionsEmbed(welcomeConfig),
      ],
    });
  } catch (error) {
    interaction.client.logger.error(error);
  }
};

export const welcomeMessageModal = async (interaction: ButtonInteraction) => {
  const welcomeConfig = await editWelcomeConfig(interaction, {});

  const modal = new ModalBuilder()
    .setCustomId(`welcomeMessageEdit-${interaction.user.id}`)
    .setTitle("Modifiez le message de bienvenue");

  const hex_color = new TextInputBuilder()
    .setCustomId("hex_color")
    .setLabel("Couleur (e.g. #00FF00)")
    .setValue(decimalToHex(welcomeConfig.hex_color))
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const message = new TextInputBuilder()
    .setCustomId("message")
    .setLabel("Votre message, avec les variables")
    .setValue(welcomeConfig.message)
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(2000)
    .setRequired(true);

  const rows = [hex_color, message].map((field) =>
    new ActionRowBuilder<TextInputBuilder>().addComponents(field),
  );

  modal.addComponents(...rows);

  await interaction.showModal(modal);
};

export const welcomeMessageEdit = async (
  interaction: ModalSubmitInteraction,
) => {
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

  const welcomeConfig = await editWelcomeConfig(interaction, {
    hex_color: hexToDecimal(hex_color),
    message,
  });
  await editWelcomeMessage(interaction, welcomeConfig);
};

export const welcomeMessageUserPing = async (
  interaction: ButtonInteraction,
) => {
  await interaction.deferUpdate();
  const welcomeConfig = await editWelcomeConfig(interaction, {});
  welcomeConfig.ping_user = !welcomeConfig.ping_user;
  await editWelcomeConfig(interaction, welcomeConfig);
  await editWelcomeMessage(interaction, welcomeConfig);
};

export const welcomeMessageVariables = async (
  interaction: ButtonInteraction,
) => {
  await interaction.reply({
    content: getVariable().join("\n"),
    ephemeral: true,
  });
};

export const welcomeMessageReset = async (interaction: ButtonInteraction) => {
  await interaction.deferUpdate();
  const welcomeConfig = await editWelcomeConfig(interaction, {
    hex_color: Colors.Green,
    message: "Bienvenue sur **{server}**, {user.mention} !",
    attachment: null,
    channel_ids: [],
    role_ids: [],
    ping_user: false,
  });
  await editWelcomeMessage(interaction, welcomeConfig);
};

export const welcomeMessageClose = async (interaction: ButtonInteraction) => {
  await interaction.deferUpdate();
  await interaction.message?.delete().catch(() => null);
};

export const welcomeMessageChannelSelect = async (
  interaction: ChannelSelectMenuInteraction,
) => {
  await interaction.deferUpdate();
  const welcomeConfig = await editWelcomeConfig(interaction, {
    channel_ids: interaction.values,
  });
  await editWelcomeMessage(interaction, welcomeConfig);
};

export const welcomeMessageRoleSelect = async (
  interaction: RoleSelectMenuInteraction,
) => {
  await interaction.deferUpdate();

  const welcomeConfig = await editWelcomeConfig(interaction, {
    role_ids: interaction.values,
  });
  await editWelcomeMessage(interaction, welcomeConfig);
};
