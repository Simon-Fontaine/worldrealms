import {
  Interaction,
  OverwriteResolvable,
  PermissionFlagsBits,
} from "discord.js";
import { SchemaRole } from "../models/interfaces";
import { getElevatedRoles, getNormalRoles, getRoles } from "./user";

export const getNormalPermissions = async (
  interaction: Interaction,
  addUser: boolean = false,
): Promise<OverwriteResolvable[]> => {
  if (!interaction.guild) {
    throw new Error("Interaction guild is null");
  }

  const roles = await getNormalRoles(interaction);

  const permissions: OverwriteResolvable[] = roles.map((role: SchemaRole) => ({
    id: role._id,
    allow: [PermissionFlagsBits.ViewChannel],
  }));

  permissions.push({
    id: interaction.guild.roles.everyone.id,
    deny: [PermissionFlagsBits.ViewChannel],
  });

  if (addUser) {
    permissions.push({
      id: interaction.user.id,
      allow: [PermissionFlagsBits.ViewChannel],
    });
  }

  return permissions;
};

export const getNormalMentions = async (
  interaction: Interaction,
): Promise<string[]> => {
  const roles = await getNormalRoles(interaction);
  return roles.map((role: SchemaRole) => `<@&${role._id}>`);
};

export const getElevatedPermissions = async (
  interaction: Interaction,
  addUser: boolean = false,
): Promise<OverwriteResolvable[]> => {
  if (!interaction.guild) {
    throw new Error("Interaction guild is null");
  }

  const roles = await getElevatedRoles(interaction);

  const permissions: OverwriteResolvable[] = roles.map((role: SchemaRole) => ({
    id: role._id,
    allow: [PermissionFlagsBits.ViewChannel],
  }));

  permissions.push({
    id: interaction.guild.roles.everyone.id,
    deny: [PermissionFlagsBits.ViewChannel],
  });

  if (addUser) {
    permissions.push({
      id: interaction.user.id,
      allow: [PermissionFlagsBits.ViewChannel],
    });
  }

  return permissions;
};

export const getElevatedMentions = async (
  interaction: Interaction,
): Promise<string[]> => {
  const roles = await getElevatedRoles(interaction);
  return roles.map((role: SchemaRole) => `<@&${role._id}>`);
};

export const getGlobalPermissions = async (
  interaction: Interaction,
  addUser: boolean = false,
): Promise<OverwriteResolvable[]> => {
  if (!interaction.guild) {
    throw new Error("Interaction guild is null");
  }

  const roles = await getRoles(interaction);

  const permissions: OverwriteResolvable[] = roles.map((role: SchemaRole) => ({
    id: role._id,
    allow: [PermissionFlagsBits.ViewChannel],
  }));

  permissions.push({
    id: interaction.guild.roles.everyone.id,
    deny: [PermissionFlagsBits.ViewChannel],
  });

  if (addUser) {
    permissions.push({
      id: interaction.user.id,
      allow: [PermissionFlagsBits.ViewChannel],
    });
  }

  return permissions;
};

export const getGlobalMentions = async (
  interaction: Interaction,
): Promise<string[]> => {
  const roles = await getRoles(interaction);
  return roles.map((role: SchemaRole) => `<@&${role._id}>`);
};

export const checkExistingRoles = (
  interaction: Interaction,
  permissions: OverwriteResolvable[],
): OverwriteResolvable[] => {
  if (!interaction.guild) {
    throw new Error("Interaction guild is null");
  }

  for (const overwrite of permissions) {
    if (overwrite.id === interaction.guild.roles.everyone.id) continue;
    if (overwrite.id === interaction.user.id) continue;

    const role = interaction.guild.roles.cache.get(overwrite.id as string);
    if (!role) {
      permissions = permissions.filter((p) => p.id !== overwrite.id);
    }
  }

  return permissions;
};
