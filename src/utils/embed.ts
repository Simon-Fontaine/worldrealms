import {
  SchemaArchive,
  SchemaLeaveMessage,
  SchemaWelcomeMessage,
} from "../types";
import { Emojis } from "./emojis";
import { replaceVariables } from "./variable";
import { EmbedBuilder } from "@discordjs/builders";
import { codeBlock, Colors, Guild, User } from "discord.js";

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

export const archiveEmbed = (config: SchemaArchive) => {
  return new EmbedBuilder().setColor(Colors.Blurple).setFields([
    {
      name: `${Emojis.search} Salon utilisateur`,
      value: `<#${config.user_channel}>`,
      inline: true,
    },
    {
      name: `${Emojis.lock} Salon Staff`,
      value: `<#${config.staff_channel}>`,
      inline: true,
    },
  ]);
};

export const variableEmbed = (
  color: number,
  content: string,
  server: Guild,
  user: User,
) => {
  content = content.slice(0, 2048);

  return new EmbedBuilder()
    .setColor(color)
    .setDescription(replaceVariables(content, server, user));
};

export const leaveOptionsEmbed = (leaveConfig: SchemaLeaveMessage) => {
  const channelMentions = leaveConfig.channel_ids
    .map((id) => `<#${id}>`)
    .join(", ");

  return new EmbedBuilder().setColor(Colors.Blurple).setFields([
    {
      name: `${Emojis.wave} Salons de Départ`,
      value: channelMentions || "Aucun",
      inline: true,
    },
    {
      name: `${Emojis.speechmessage} Message Brut`,
      value: codeBlock("md", leaveConfig.message),
      inline: false,
    },
  ]);
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
      name: `${Emojis.wave} Salons de Bienvenue`,
      value: channelMentions || "Aucun",
      inline: true,
    },
    {
      name: `${Emojis.link} Roles ajoutés`,
      value: roleMentions || "Aucun",
      inline: true,
    },
    {
      name: `${welcomeConfig.ping_user ? Emojis.check_mark_green : Emojis.x_red} Mention`,
      value: welcomeConfig.ping_user ? `Oui` : `Non`,
      inline: true,
    },
    {
      name: `${Emojis.speechmessage} Message Brut`,
      value: codeBlock("md", welcomeConfig.message),
      inline: false,
    },
  ]);
};
