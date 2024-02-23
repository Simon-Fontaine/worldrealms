import {
  Attachment,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("test")
    .addAttachmentOption((option) =>
      option.setName("file").setDescription("test").setRequired(true),
    ),
  execute(interaction: ChatInputCommandInteraction) {
    const attachment = interaction.options.getAttachment("file") as Attachment;

    console.log(attachment);

    interaction.reply({ content: `Attachment: ${attachment.url}` });
  },
};
