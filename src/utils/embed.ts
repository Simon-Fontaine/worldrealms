import { SchemaWelcomeMessage } from "../types";
import { Emojis } from "./emojis";
import { replaceVariables } from "./variable";
import { EmbedBuilder } from "@discordjs/builders";
import { codeBlock, Colors, Interaction, RGBTuple } from "discord.js";

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

export const welcomeEmbed = (
  color: number | RGBTuple | null,
  content: string,
  interaction: Interaction,
) => {
  content = content.slice(0, 2048);

  return new EmbedBuilder()
    .setColor(color)
    .setDescription(replaceVariables(content, interaction));
};

export const welcomeOptionsEmbed = (welcomeConfig: SchemaWelcomeMessage) => {
  const channelMentions = welcomeConfig.channel_ids
    .map((id) => `<#${id}>`)
    .join(", ");
  const roleMentions = welcomeConfig.role_ids
    .map((id) => `<@&${id}>`)
    .join(", ");

  return new EmbedBuilder().setColor(Colors.Blurple).setFields([
    {
      name: "Salons",
      value: channelMentions || "Aucun",
      inline: true,
    },
    {
      name: "Roles",
      value: roleMentions || "Aucun",
      inline: true,
    },
    {
      name: "\u200B",
      value: "\u200B",
      inline: true,
    },
    {
      name: "Mention",
      value: welcomeConfig.ping_user ? "Oui" : "Non",
      inline: true,
    },
    {
      name: "Couleur",
      value: `${welcomeConfig.hex_color}`,
      inline: true,
    },
    {
      name: "\u200B",
      value: "\u200B",
      inline: true,
    },
    {
      name: "Message",
      value: codeBlock("md", welcomeConfig.message),
      inline: false,
    },
  ]);
};
