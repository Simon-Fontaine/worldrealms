import welcomeMessageSchema from "../models/welcome-message.schema";
import { welcomeEmbed } from "../utils/embed";
import { Events, GuildMember, GuildTextBasedChannel } from "discord.js";

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    const welcomeConfig = await welcomeMessageSchema.findById(member.guild.id);
    if (!welcomeConfig) return;

    welcomeConfig.role_ids.forEach((roleId: string) => {
      member.roles.add(roleId).catch(() => {});
    });

    welcomeConfig.channel_ids.forEach((channelId: string) => {
      const channel = member.guild?.channels.cache.get(
        channelId,
      ) as GuildTextBasedChannel;
      if (!channel) return;

      channel
        .send({
          content: welcomeConfig.ping_user ? member.toString() : undefined,
          embeds: [
            welcomeEmbed(
              welcomeConfig.hex_color,
              welcomeConfig.message,
              member.guild,
              member.user,
            ),
          ],
        })
        .catch(() => {});
    });
  },
};
