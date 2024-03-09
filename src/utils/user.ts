import roleSchema from "../models/role.schema";
import userSchema from "../models/user.schema";
import { SchemaRole, SchemaUser } from "../types";
import { Interaction, User } from "discord.js";

export function cleanUsername(query: User) {
  return query.discriminator !== "0"
    ? `${query.username}#${query.discriminator}`
    : `@${query.username}`;
}

async function getRolesByFilter(
  filter: Partial<SchemaRole>,
): Promise<SchemaRole[]> {
  const roles = await roleSchema.find(filter);
  return roles || [];
}

export async function getRoles(interaction: Interaction) {
  return getRolesByFilter({ guild_id: interaction.guildId });
}

export function getNormalRoles(interaction: Interaction) {
  return getRolesByFilter({
    elevated: false,
    guild_id: interaction.guildId,
  });
}

export function getElevatedRoles(interaction: Interaction) {
  return getRolesByFilter({
    elevated: true,
    guild_id: interaction.guildId,
  });
}

export async function getRole(
  interaction: Interaction,
): Promise<SchemaRole | null> {
  const user = await userSchema.findOne({
    user_id: interaction.user.id,
    guild_id: interaction.guildId,
  });

  if (!user) {
    return null;
  }

  const roles = await getRoles(interaction);
  return roles.find((r: SchemaRole) => r._id === user.role) || null;
}

export async function isStaff(interaction: Interaction): Promise<boolean> {
  const role = await getRole(interaction);
  return role !== null;
}

export async function isHighStaff(interaction: Interaction): Promise<boolean> {
  const role = await getRole(interaction);
  return role !== null && role.elevated;
}
