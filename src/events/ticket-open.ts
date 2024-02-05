import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	Colors,
	EmbedBuilder,
	Events,
	Interaction,
	OverwriteResolvable,
} from 'discord.js';
import {
	checkExistingRoles,
	getElevatedMentions,
	getElevatedPermissions,
	getGlobalPermissions,
	getNormalMentions,
} from '../utils/permissions';
import ticketSchema from '../models/ticket.schema';
import { errorEmbed, successEmbed } from '../utils/embed';
import ticketPanelSchema from '../models/ticket-panel.schema';
import { cleanUsername, isStaff } from '../utils/user';
import { Emojis } from '../utils/emojis';

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

		const globalPermissionOverwrites = checkExistingRoles(
			interaction,
			await getGlobalPermissions(interaction)
		);

		let ticket_category = interaction.guild?.channels.cache.find(
			(channel) =>
				channel.name === 'TICKETS' && channel.type === ChannelType.GuildCategory
		);

		if (!ticket_category) {
			ticket_category = await interaction.guild!.channels.create({
				name: 'TICKETS',
				reason: 'Création de la catégorie pour les tickets',
				type: ChannelType.GuildCategory,
				permissionOverwrites: globalPermissionOverwrites,
			});
		} else {
			ticket_category.edit({
				permissionOverwrites: globalPermissionOverwrites,
			});
		}

		let ticketPermissions: OverwriteResolvable[];
		let ticketMentions: string[];

		const isStaffTicket = await isStaff(interaction.user);

		if (isStaffTicket) {
			ticketPermissions = checkExistingRoles(
				interaction,
				await getElevatedPermissions(interaction, true)
			);
			ticketMentions = await getElevatedMentions();
		} else {
			ticketPermissions = checkExistingRoles(
				interaction,
				await getGlobalPermissions(interaction, true)
			);
			ticketMentions = await getNormalMentions();
		}

		ticketMentions.push(`<@${interaction.user.id}>`);

		const channel = await interaction.guild?.channels.create({
			name: `ticket-${interaction.user.username}`,
			parent: ticket_category.id,
			reason: `Création du ticket de ${cleanUsername(interaction.user)}`,
			permissionOverwrites: ticketPermissions,
		});

		const ticket = await ticketSchema.create({
			_id: channel!.id,
			type: isStaffTicket ? 'staff' : 'user',
			label: label,
			creator_id: interaction.user.id,
			creator_username: cleanUsername(interaction.user),
		});

		const embed = new EmbedBuilder()
			.setTitle(label)
			.setColor(Colors.Blurple)
			.setDescription(
				[
					`${Emojis.exclamation_mark} **${cleanUsername(
						interaction.user
					)}** (\`${interaction.user.id}\`)`,
					'',
					`${Emojis.exclamation_mark_orange} **Renseignez les informations suivantes :**`,
					'Une description de votre demande et votre pseudo en jeu.',
					'',
					`${Emojis.exclamation_mark_red} **Attention :**`,
					'Sans réponse de votre part pendant 24 heures, votre ticket sera fermé.',
				].join('\n')
			);

		const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId(`ticketClose-${ticket._id}`)
				.setEmoji(Emojis.x_red)
				.setLabel('Fermer')
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId(`ticketLock-${ticket._id}`)
				.setEmoji(Emojis.lock)
				.setLabel('Verrouiller')
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId(`ticketAddUser-${ticket._id}`)
				.setEmoji(Emojis.plus)
				.setLabel('Ajouter')
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId(`ticketClaim-${ticket._id}`)
				.setEmoji(Emojis.wave)
				.setLabel('Claim')
				.setStyle(ButtonStyle.Secondary)
		);

		await channel!.send({
			content: ticketMentions.join(' '),
			embeds: [embed],
			components: [buttons],
		});

		await interaction.editReply({
			embeds: [
				successEmbed(
					`Votre ticket a été créé avec succès <#${channel!.id}>\n(ID: \`${
						ticket._id
					}\`)`
				),
			],
		});
	},
};
