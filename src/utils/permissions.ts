import {
	Interaction,
	OverwriteResolvable,
	PermissionFlagsBits,
} from 'discord.js';
import { getElevatedRoles, getNormalRoles, getRoles } from './user';

export const getElevatedPermissions = async (
	interaction: Interaction | null,
	addUser: boolean = false
): Promise<OverwriteResolvable[]> => {
	const elevatedRoles = await getElevatedRoles();

	const elevatedPermissions: OverwriteResolvable[] = elevatedRoles.map(
		(role) => ({
			id: role.role_id,
			allow: [PermissionFlagsBits.ViewChannel],
		})
	);

	if (interaction?.guild) {
		elevatedPermissions.push({
			id: interaction.guild.roles.everyone.id,
			deny: [PermissionFlagsBits.ViewChannel],
		});
	}

	if (addUser) {
		elevatedPermissions.push({
			id: interaction?.user.id!,
			allow: [PermissionFlagsBits.ViewChannel],
		});
	}

	return elevatedPermissions;
};

export const getElevatedMentions = async (): Promise<string[]> => {
	const elevatedRoles = await getElevatedRoles();

	return elevatedRoles.map((role) => `<@&${role.role_id}>`);
};

export const getNormalPermissions = async (
	interaction: Interaction | null,
	addUser: boolean = false
): Promise<OverwriteResolvable[]> => {
	const normalRoles = await getNormalRoles();

	const normalPermissions: OverwriteResolvable[] = normalRoles.map((role) => ({
		id: role.role_id,
		allow: [PermissionFlagsBits.ViewChannel],
	}));

	if (interaction?.guild) {
		normalPermissions.push({
			id: interaction.guild.roles.everyone.id,
			deny: [PermissionFlagsBits.ViewChannel],
		});
	}

	if (addUser) {
		normalPermissions.push({
			id: interaction?.user.id!,
			allow: [PermissionFlagsBits.ViewChannel],
		});
	}

	return normalPermissions;
};

export const getNormalMentions = async (): Promise<string[]> => {
	const normalRoles = await getNormalRoles();

	return normalRoles.map((role) => `<@&${role.role_id}>`);
};

export const getGlobalPermissions = async (
	interaction: Interaction | null,
	addUser: boolean = false
): Promise<OverwriteResolvable[]> => {
	const globalRoles = await getRoles();

	const globalPermissions: OverwriteResolvable[] = globalRoles.map((role) => ({
		id: role.role_id,
		allow: [PermissionFlagsBits.ViewChannel],
	}));

	if (interaction?.guild) {
		globalPermissions.push({
			id: interaction.guild.roles.everyone.id,
			deny: [PermissionFlagsBits.ViewChannel],
		});
	}

	if (addUser) {
		globalPermissions.push({
			id: interaction?.user.id!,
			allow: [PermissionFlagsBits.ViewChannel],
		});
	}

	return globalPermissions;
};

export const getGlobalMentions = async (): Promise<string[]> => {
	const globalRoles = await getRoles();

	return globalRoles.map((role) => `<@&${role.role_id}>`);
};

export const checkExistingRoles = (
	interaction: Interaction,
	permissions: OverwriteResolvable[]
): OverwriteResolvable[] => {
	for (const overwrite of permissions) {
		if (overwrite.id === interaction.guild?.roles.everyone.id) continue;
		if (overwrite.id === interaction.user.id) continue;

		const role = interaction.guild?.roles.cache.get(overwrite.id as string);
		if (!role) {
			permissions.splice(permissions.indexOf(overwrite), 1);
		}
	}

	return permissions;
};
