import { cleanUsername } from "./user";
import { Interaction } from "discord.js";

export const getVariable = () => {
  return [
    "**Variables Utilisateurs**",
    "`{user}` `{user.mention}` | Mention de l'utilisateur",
    "`{user.id}` | Identifiant de l'utilisateur",
    "`{user.name}` | Nom de l'utilisateur",
    "`{user.discriminator}` | Discriminateur de l'utilisateur (e.g. #7306)",
    "`{user.idname}` | Tag de l'utilisateur (e.g. Rubby#7306)",
    "`{user.avatar_url}` | Avatar de l'utilisateur",
    "",
    "**Variables Serveur**",
    "`{server}` `{server.name}` | Nom du serveur",
    "`{server.id}` | Identifiant du serveur",
    "`{server.icon_url}` | Icône du serveur",
    "`{server.owner_id}` | Identifiant du propriétaire du serveur",
    "`{server.owner}` | Mention du propriétaire du serveur",
    "`{server.lang}` | Langue du serveur (e.g. fr-FR)",
    "`{server.member_count}` | Nombre de membres sur le serveur",
    "",
    "**Variables Salon**",
    "`{channel.rules}` | Mention du salon des règles",
  ];
};

export const replaceVariables = (content: string, interaction: Interaction) => {
  if (!interaction.guild) return content;

  const server = interaction.guild;
  const user = interaction.user;
  const owner = server.members.cache.get(server.ownerId);

  const variables = {
    "{user}": user,
    "{user.mention}": user,
    "{user.id}": user.id,
    "{user.name}": user.username,
    "{user.discriminator}": user.discriminator,
    "{user.idname}": cleanUsername(user),
    "{user.avatar_url}": user.avatarURL({ forceStatic: false }),
    "{server}": server.name,
    "{server.name}": server.name,
    "{server.id}": server.id,
    "{server.icon_url}": server.iconURL({ forceStatic: false }),
    "{server.owner_id}": server.ownerId,
    "{server.owner}": owner,
    "{server.lang}": server.preferredLocale,
    "{server.member_count}": server.memberCount,
    "{channel.rules}": server.rulesChannel,
  } as { [key: string]: any };

  for (let key in variables) {
    content = content.replace(new RegExp(key, "g"), variables[key]);
  }

  return content;
};
