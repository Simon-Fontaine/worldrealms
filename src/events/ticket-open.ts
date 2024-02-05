import { Events, Interaction } from 'discord.js';
import ticketSchema from '../models/ticket.schema';
import { errorEmbed } from '../utils/embed';
import ticketPanelSchema from '../models/ticket-panel.schema';

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction: Interaction) {
		if (!interaction.isButton() || !interaction.channel) return;

		const [action, id, label] = interaction.customId.split('-');
		if (action !== 'ticketOpen') return;

		await interaction.deferReply({ ephemeral: true });

		const existing = await ticketSchema.findOne({
			creator_id: interaction.user.id,
			closed: false,
		});

		if (existing)
			return await interaction.editReply({
				embeds: [
					errorEmbed(`Vous avez déjà un ticket ouvert (<#${existing._id}>)`),
				],
			});

		const panel = await ticketPanelSchema.findById(id);
		if (!panel)
			return await interaction.editReply({
				embeds: [errorEmbed("Ce panel n'existe plus. Veuillez le supprimer.")],
			});

		if (panel.paused)
			return await interaction.editReply({
				embeds: [errorEmbed('Ce panel est actuellement en pause.')],
			});
	},
};
