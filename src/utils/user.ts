import roleSchema from "../models/role.schema";
import userSchema from "../models/user.schema";
import { SchemaRole, SchemaUser } from "../types";
import { Interaction, User } from "discord.js";

export const cleanUsername = (query: User) => {
  return query.discriminator !== "0"
    ? `${query.username}#${query.discriminator}`
    : `@${query.username}`;
};

const getRolesByFilter = async (
  filter: Partial<SchemaRole>,
): Promise<SchemaRole[]> => {
  const roles = await roleSchema.find(filter);
  // console.log(roles);
  return roles || [];
};

export const getRoles = (interaction: Interaction) =>
  getRolesByFilter({ guild_id: interaction.guildId });

export const getNormalRoles = (interaction: Interaction) =>
  getRolesByFilter({
    elevated: false,
    guild_id: interaction.guildId,
  });

export const getElevatedRoles = (interaction: Interaction) =>
  getRolesByFilter({
    elevated: true,
    guild_id: interaction.guildId,
  });

export const getRole = async (
  interaction: Interaction,
): Promise<SchemaRole | null> => {
  const user = await userSchema.findOne({
    _id: interaction.user.id,
    guild_id: interaction.guildId,
  });

  if (!user) {
    return null;
  }

  const roles = await getRoles(interaction);
  return roles.find((r: SchemaRole) => r._id === user.role) || null;
};

export const isStaff = async (interaction: Interaction): Promise<boolean> => {
  const role = await getRole(interaction);
  return role !== null;
};

export const isHighStaff = async (
  interaction: Interaction,
): Promise<boolean> => {
  const role = await getRole(interaction);
  return role !== null && role.elevated;
};
