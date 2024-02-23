import leaveMessageSchema from "../models/leave-message.schema";
import { variableEmbed } from "../utils/embed";
import { Events, GuildMember, GuildTextBasedChannel } from "discord.js";

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member: GuildMember) {
    const leaveConfig = await leaveMessageSchema.findById(member.guild.id);
    if (!leaveConfig) return;

    leaveConfig.channel_ids.forEach((channelId: string) => {
      const channel = member.guild?.channels.cache.get(
        channelId,
      ) as GuildTextBasedChannel;
      if (!channel) return;

      channel
        .send({
          embeds: [
            variableEmbed(
              leaveConfig.hex_color,
              leaveConfig.message,
              member.guild,
              member.user,
            ),
          ],
        })
        .catch(() => {});
    });
  },
};
