import { Emojis } from "./emojis";
import { EmbedBuilder } from "@discordjs/builders";
import { Colors } from "discord.js";

export const successEmbed = (content: string | null = null) => {
  content = content ? content.slice(0, 2048) : null;

  if (content) {
    content = content.replace(/^(?=.)/gm, "> ");
  }

  return new EmbedBuilder()
    .setTitle(`${Emojis.check_mark_green} Succès`)
    .setColor(Colors.Green)
    .setDescription(content);
};

export const errorEmbed = (content: string | null = null) => {
  content = content ? content.slice(0, 2048) : null;

  if (content) {
    content = content.replace(/^(?=.)/gm, "> ");
  }

  return new EmbedBuilder()
    .setTitle(`${Emojis.x_red} Erreur`)
    .setColor(Colors.Red)
    .setDescription(content);
};
