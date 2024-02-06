import {
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	PermissionFlagsBits,
	Colors,
	EmbedBuilder,
} from 'discord.js';
import roleSchema from '../../models/role.schema';
import { errorEmbed, successEmbed } from '../../utils/embed';
import userSchema from '../../models/user.schema';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('staffroles')
		.setDescription('Configure les rôles du staff.')
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addRoleOption((option) =>
			option
				.setName('role')
				.setDescription('Rôle à ajouter ou supprimer.')
				.setRequired(false)
		)
		.addBooleanOption((option) =>
			option
				.setName('élevé')
				.setDescription('Si le rôle est élevé.')
				.setRequired(false)
		)
		.addIntegerOption((option) =>
			option
				.setName('poids')
				.setDescription('Poids du rôle.')
				.setRequired(false)
		),
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });

		const role = interaction.options.getRole('role');
		const name = role?.name.toLocaleLowerCase();
		const elevated = interaction.options.getBoolean('élevé');
		const weight = interaction.options.getInteger('poids');

		if (!role) {
			const roles = await roleSchema.find();

			if (roles.length <= 0) {
				return await interaction.editReply({
					embeds: [errorEmbed('Aucun role trouvé dans la base de données')],
				});
			}

			const elevatedRoles = roles
				.filter((role) => role.elevated)
				.sort((a, b) => b.weight - a.weight)
				.map((role) => `<@&${role.role_id}> (${role.weight})`)
				.join(', ');

			const normalRoles = roles
				.filter((role) => !role.elevated)
				.sort((a, b) => b.weight - a.weight)
				.map((role) => `<@&${role.role_id}> (${role.weight})`)
				.join(', ');

			const embed = new EmbedBuilder().setColor(Colors.Blurple).addFields(
				{
					name: 'Roles élevés',
					value: elevatedRoles || 'Aucun role élevé',
				},
				{
					name: 'Roles normaux',
					value: normalRoles || 'Aucun role normal',
				}
			);

			return await interaction.editReply({
				embeds: [embed],
			});
		}

		if (elevated === null || weight === null) {
			const roleData = await roleSchema.findOneAndDelete({ _id: name });
			await userSchema.deleteMany({ role: name });

			if (!roleData) {
				return await interaction.editReply({
					embeds: [errorEmbed('Aucun role trouvé dans la base de données')],
				});
			}

			return interaction.editReply({
				embeds: [successEmbed(`Role ${role} supprimé de la base de données`)],
			});
		}

		await roleSchema.findOneAndUpdate(
			{ _id: name },
			{
				_id: name,
				role_id: role.id,
				elevated,
				weight,
			},
			{ upsert: true, new: true }
		);

		return interaction.editReply({
			embeds: [successEmbed(`Role ${role} ajouté à la base de données`)],
		});
	},
};
