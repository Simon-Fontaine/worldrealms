import pollSchema from "../../models/poll.schema";
import { Poll, PollChoice } from "../../types";
import { createProgressBar, errorEmbed, pollEmbed } from "../../utils/embed";
import { Emojis, Letters } from "../../utils/emojis";
import { splitAndTrim } from "../../utils/strings";
import { cleanUsername } from "../../utils/user";
import { ModalSubmitInteraction } from "discord.js";

export const pollCreate = async (interaction: ModalSubmitInteraction) => {
  await interaction.reply({ content: Emojis.loading });

  const question = interaction.fields.getTextInputValue("question");
  const duration = interaction.fields.getTextInputValue("duration");
  const firstChoice = interaction.fields.getTextInputValue("firstChoice");
  const secondChoice = interaction.fields.getTextInputValue("secondChoice");
  const otherChoices = interaction.fields.getTextInputValue("otherChoices");
  const choices = [firstChoice, secondChoice, ...splitAndTrim(otherChoices)];

  if (choices.length < 2 || choices.length > 20)
    return await interaction.editReply({
      content: null,
      embeds: [
        errorEmbed("Le nombre de choix doit être compris entre 2 et 20."),
      ],
    });

  const poll: Poll = {
    _id: "temp-id",
    guild_id: interaction.guildId!,
    channel_id: interaction.channelId!,
    result_message_id: undefined,
    creator_id: interaction.user.id,
    creator_username: cleanUsername(interaction.user),
    question,
    choices: choices.map((choice, index) => ({
      choice,
      emoji: Letters[index],
      voters: [],
    })),
    allowed_roles: [],
    max_choices: undefined,
    created_at: new Date(),
    closed_at: undefined,
    expires_at: duration ? new Date(duration) : undefined,
  };

  console.log(poll);

  await interaction.editReply({
    content: null,
    embeds: [pollEmbed(poll)],
  });

  await interaction.channel?.send({
    embeds: [pollEmbed(poll, true)],
  });
};
