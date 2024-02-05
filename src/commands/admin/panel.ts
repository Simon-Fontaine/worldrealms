import {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChatInputCommandInteraction,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
} from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed';
import archiveSchema from '../../models/archive.schema';
import ticketPanelSchema from '../../models/ticket-panel.schema';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('panel')
		.setDescription('Configure les panels de tickets.')
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand((subcommand) =>
			subcommand.setName('create').setDescription('Crée un panel de ticket.')
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('delete')
				.setDescription('Supprime un panel de ticket.')
				.addStringOption((option) =>
					option
						.setName('id')
						.setDescription('ID du panel à supprimer.')
						.setRequired(true)
						.setAutocomplete(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('pause')
				.setDescription('Met en pause un panel de ticket.')
				.addStringOption((option) =>
					option
						.setName('id')
						.setDescription('ID du panel à supprimer.')
						.setRequired(true)
						.setAutocomplete(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('archive')
				.setDescription("Défini les salons d'archives de tickets.")
		),
	async execute(interaction: ChatInputCommandInteraction) {
		const subcommands = interaction.options.getSubcommand();

		switch (subcommands) {
			case 'create':
				{
					const modal = new ModalBuilder()
						.setCustomId('ticket-panel-creation')
						.setTitle('Ticket Panel Creation');

					const subject = new TextInputBuilder()
						.setCustomId('panel-subject')
						.setLabel('sujet du panel')
						.setMaxLength(250)
						.setStyle(TextInputStyle.Short);

					const buttons = new TextInputBuilder()
						.setCustomId('panel-buttons')
						.setLabel('boutons (séparés par une virgule)')
						.setPlaceholder('Support, Aide, Autre')
						.setStyle(TextInputStyle.Paragraph);

					const styes = new TextInputBuilder()
						.setCustomId('panel-styles')
						.setLabel('styles des boutons (séparés par une virgule)')
						.setPlaceholder('rouge, vert, bleu, gris (par défaut)')
						.setRequired(false)
						.setStyle(TextInputStyle.Paragraph);

					const rows = [subject, buttons, styes].map((field) =>
						new ActionRowBuilder<TextInputBuilder>().addComponents(field)
					);

					modal.addComponents(rows[0], rows[1], rows[2]);

					await interaction.showModal(modal);
				}
				break;
			case 'delete':
				{
				}
				break;
			case 'pause':
				{
				}
				break;
			case 'archive':
				{
				}
				break;
		}
	},
};
