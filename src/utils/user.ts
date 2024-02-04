import { User } from 'discord.js';
import userSchema from '../models/user.schema';
import roleSchema from '../models/role.schema';

export interface SchemaRole {
	_id: string;
	role_id: string;
	elevated: boolean;
	weight: number;
}

export interface SchemaUser {
	_id: string;
	name: string;
	avatar: string;
	created_at: Date;
	role: string;
}

export const cleanUsername = (query: User) => {
	return query.discriminator !== '0'
		? `${query.username}#${query.discriminator}`
		: `@${query.username}`;
};

export const getRoles = async (): Promise<SchemaRole[]> => {
	return await roleSchema.find();
};

export const getNormalRoles = async (): Promise<SchemaRole[]> => {
	return await roleSchema.find({ elevated: false });
};

export const getElevatedRoles = async (): Promise<SchemaRole[]> => {
	return await roleSchema.find({ elevated: true });
};

export const getRole = async (query: User): Promise<SchemaRole | null> => {
	const user = await userSchema.findById(query.id);
	const roles = await roleSchema.find();

	if (!user) {
		return null;
	}

	const role = roles.find((r) => r._id === user.role);
	return role || null;
};

export const isStaff = async (query: User): Promise<boolean> => {
	const role = await getRole(query);
	return role !== null;
};

export const isHighStaff = async (query: User): Promise<boolean> => {
	const role = await getRole(query);
	return role !== null && role.elevated;
};
