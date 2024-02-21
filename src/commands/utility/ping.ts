import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
} from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Donne la latence du bot."),
  execute(interaction: ChatInputCommandInteraction) {
    const roundTripLatency = (Date.now() - interaction.createdTimestamp) / 1000;
    const websocketLatency =
      interaction.client.ws.ping === -1 ? 0 : interaction.client.ws.ping / 1000;

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setDescription(
        [
          `**Guild Ping:** \`${roundTripLatency}s\``,
          `**API Ping:** \`${websocketLatency}s\``,
        ].join("\n"),
      );

    const shardId = interaction.guild?.shardId ? interaction.guild.shardId : 1;
    const shardCount = interaction.client.options.shardCount
      ? interaction.client.options.shardCount
      : 1;

    embed.setFooter({
      text: `Shard ${shardId}/${shardCount} • Guilds: ${interaction.client.guilds.cache.size} • Members: ${interaction.client.users.cache.size}`,
    });

    interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
