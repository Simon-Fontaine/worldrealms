import pollSchema from "../models/poll.schema";
import { PollChoice } from "../types";
import { createProgressBar, pollEmbed } from "../utils/embed";
import {
  Client,
  Colors,
  EmbedBuilder,
  GuildTextBasedChannel,
} from "discord.js";

class EndPollsTask {
  public readonly name = "EndPolls";
  readonly interval: number;

  constructor() {
    this.interval = 1000 * 10;
  }

  async run(client: Client): Promise<void> {
    const closed_at = new Date();
    const polls = await pollSchema.find({
      expires_at: { $lt: closed_at },
      closed_at: undefined,
    });

    if (!polls.length) {
      client.logger.debug("No polls to end");
      return;
    }

    client.logger.info(`Ending ${polls.length} polls`);

    for (const poll of polls) {
      try {
        await this.endPoll(client, poll, closed_at);
      } catch (error) {
        client.logger.error(`Error ending poll: ${poll._id}`, error);
      }
    }
  }

  private async endPoll(
    client: Client,
    poll: any,
    closed_at: Date,
  ): Promise<void> {
    poll.closed_at = closed_at;

    const guild = client.guilds.cache.get(poll.guild_id);
    if (!guild) {
      client.logger.warn(`Guild not found for poll: ${poll._id}`);
      await pollSchema.deleteOne({ _id: poll._id, guild_id: poll.guild_id });
      return;
    }

    const channel = guild.channels.cache.get(poll.channel_id) as
      | GuildTextBasedChannel
      | undefined;
    if (!channel) {
      client.logger.warn(
        `Channel not found for poll in guild ${guild.name} (${guild.id}): ${poll._id}`,
      );
      await pollSchema.deleteOne({ _id: poll._id, guild_id: poll.guild_id });
      return;
    }

    const message = await channel.messages.fetch(poll._id).catch(() => null);
    if (!message) {
      client.logger.warn(
        `Message not found for poll in guild ${guild.name} (${guild.id}): ${poll._id}`,
      );
      await pollSchema.deleteOne({ _id: poll._id, guild_id: poll.guild_id });
      return;
    }

    const totalVotes = poll.choices.reduce(
      (acc: number, choice: PollChoice) => acc + choice.voters.length,
      0,
    );
    const resultString = poll.choices
      .map((choice: PollChoice) => {
        return `${choice.emoji} - ${createProgressBar(choice.voters.length, totalVotes)} ${choice.voters.length} votes`;
      })
      .join("\n");

    await message.edit({ embeds: [pollEmbed(poll)], components: [] });

    const resultMessage = await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle("Résultats")
          .setURL(message.url)
          .setDescription(resultString),
      ],
    });

    poll.result_message_id = resultMessage.id;
    await poll.save();
    client.logger.info(`Ended poll in ${guild.name} (${guild.id})`);
  }
}

export default EndPollsTask;
