import {
  Poll,
  SchemaArchive,
  SchemaLeaveMessage,
  SchemaWelcomeMessage,
} from "../types";
import { Emojis } from "./emojis";
import { replaceVariables } from "./variable";
import { EmbedBuilder } from "@discordjs/builders";
import { codeBlock, Colors, Guild, time, User } from "discord.js";

export function successEmbed(content: string | null = null) {
  content = content ? content.slice(0, 2048) : null;

  if (content) {
    content = content.replace(/^(?=.)/gm, "> ");
  }

  return new EmbedBuilder()
    .setTitle(`${Emojis.check_mark_green} Succès`)
    .setColor(Colors.Green)
    .setDescription(content);
}

export function errorEmbed(content: string | null = null) {
  content = content ? content.slice(0, 2048) : null;

  if (content) {
    content = content.replace(/^(?=.)/gm, "> ");
  }

  return new EmbedBuilder()
    .setTitle(`${Emojis.x_red} Erreur`)
    .setColor(Colors.Red)
    .setDescription(content);
}

export function archiveEmbed(config: SchemaArchive) {
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
}

export function variableEmbed(
  color: number,
  content: string,
  attachment: string | null,
  server: Guild,
  user: User,
) {
  content = content.slice(0, 2048);

  return new EmbedBuilder()
    .setColor(color)
    .setImage(attachment)
    .setDescription(replaceVariables(content, server, user));
}

export function leaveOptionsEmbed(leaveConfig: SchemaLeaveMessage) {
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
}

export function welcomeOptionsEmbed(welcomeConfig: SchemaWelcomeMessage) {
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
}

export function createProgressBar(
  currentValue = 0,
  totalValue = 1,
  barLength = 10,
  completeSymbol = "⬜",
  incompleteSymbol = "⬛",
) {
  const percent =
    totalValue === 0
      ? 0
      : Math.min(Math.max((currentValue / totalValue) * 100, 0), 100);

  const completed = completeSymbol.repeat(
    Math.floor(percent / (100 / barLength)),
  );
  const remaining = incompleteSymbol.repeat(barLength - completed.length);

  return `${completed}${remaining} [${currentValue} • ${Math.floor(percent)}%]`;
}

export function pollEmbed(poll: Poll, isInformational: boolean = false) {
  const roles =
    poll.allowed_roles.map((id) => `<@&${id}>`).join(", ") || "@everyone";
  const choices = poll.choices
    .map((choice) => `${choice.emoji} ${choice.choice}`)
    .join("\n");
  const totalVotes = poll.choices.reduce(
    (acc, choice) => acc + choice.voters.length,
    0,
  );
  const results = poll.choices
    .map(
      (choice) =>
        `${choice.emoji} ${createProgressBar(choice.voters.length, totalVotes)}`,
    )
    .join("\n");

  const fields = [
    {
      name: "ID du Sondage",
      value: isInformational ? `\`${poll._id}\`` : null,
      inline: true,
    },
    {
      name: "Statut",
      value: isInformational ? (poll.closed_at ? "Terminé" : "En cours") : null,
      inline: true,
    },
    {
      name: "Créé par",
      value: isInformational ? `<@${poll.creator_id}>` : null,
      inline: true,
    },
    {
      name: "Choix",
      value: choices,
      inline: false,
    },
    {
      name: "Résultats",
      value: isInformational ? results : null,
      inline: false,
    },
    {
      name: "Rôles autorisés",
      value: roles,
      inline: true,
    },
    {
      name: "Choix Maximum",
      value: `\`${poll.max_choices || "Aucun"}\``,
      inline: true,
    },
    {
      name: "Total de Votes",
      value: isInformational ? `\`${totalVotes}\`` : "Caché",
      inline: true,
    },
    {
      name: "Créé le",
      value: isInformational ? time(poll.created_at, "R") : null,
      inline: true,
    },
    {
      name: "Expire le",
      value:
        isInformational && poll.expires_at
          ? time(poll.expires_at, "R")
          : poll.expires_at
            ? `${time(poll.expires_at, "f")} | ${time(poll.expires_at, "R")}`
            : null,
      inline: isInformational,
    },
    {
      name: "Fermé le",
      value:
        isInformational && poll.closed_at ? time(poll.closed_at, "R") : null,
      inline: true,
    },
    {
      name: "Message",
      value: isInformational
        ? `[Sautez vers le message](https://discord.com/channels/${poll.guild_id}/${poll.channel_id}/${poll._id})`
        : null,
      inline: false,
    },
  ].filter((field) => field.value !== null);

  return new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setTitle(poll.question)
    .setURL(
      `https://discord.com/channels/${poll.guild_id}/${poll.channel_id}/${poll._id}`,
    )
    .setFields(
      fields.map((field) => ({
        ...field,
        value: field.value || "", // Set value to an empty string if it is null
      })),
    );
}
