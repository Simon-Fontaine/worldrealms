import archiveSchema from "../../models/archive.schema";
import ticketPanelSchema from "../../models/ticket-panel.schema";
import ticketSchema from "../../models/ticket.schema";
import { errorEmbed, successEmbed } from "../../utils/embed";
import { Emojis } from "../../utils/emojis";
import {
  checkExistingRoles,
  getElevatedMentions,
  getElevatedPermissions,
  getGlobalPermissions,
  getNormalMentions,
} from "../../utils/permissions";
import { cleanUsername, isStaff } from "../../utils/user";
import dayjs from "dayjs";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  BaseGuildTextChannel,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  Colors,
  EmbedBuilder,
  Message,
  OverwriteResolvable,
  UserSelectMenuBuilder,
  UserSelectMenuInteraction,
} from "discord.js";

export async function ticketClose(interaction: ButtonInteraction, ticket: any) {
  ticket.closed = true;
  ticket.closed_id = interaction.user.id;
  ticket.closed_username = cleanUsername(interaction.user);
  await ticket.save();

  await interaction.deleteReply();
  await interaction.channel?.send({
    embeds: [
      successEmbed(
        `Ce ticket a été fermé par **${ticket.closed_username}**. Il sera archivé dans quelques secondes.`,
      ),
    ],
  });

  setTimeout(async () => {
    await interaction.channel?.delete();
  }, 10000);

  const archive = await archiveSchema.findOne({
    _id: interaction.guildId,
  });

  const archiveChannel = interaction.guild?.channels.cache.get(
    ticket.type === "user" ? archive.user_channel : archive.staff_channel,
  ) as BaseGuildTextChannel;

  if (!archiveChannel)
    return interaction.channel?.send({
      embeds: [errorEmbed("Le salon d'archive n'a pas été trouvé.")],
    });

  const ticketContent = await interaction.channel?.messages.fetch({
    cache: false,
  });

  const formatMessage = (message: Message) => {
    return `[${dayjs(message.createdTimestamp).format("DD/MM/YYYY HH:mm")}] ${cleanUsername(message.author)} : ${message}`;
  };

  const ticketMessages = ticketContent
    ?.reverse()
    .filter((m) => m.author.id !== interaction.client.user?.id)
    .map((m) => formatMessage(m));

  const attachment = new AttachmentBuilder(
    Buffer.from(ticketMessages?.join("\n") || "Aucun message", "utf8"),
    {
      name: `ticket-${ticket._id}.txt`,
    },
  );

  const embed = new EmbedBuilder()
    .setTitle(`${Emojis.exclamation_mark_orange} Ticket #${ticket._id}`)
    .setColor(Colors.Blurple)
    .setDescription(
      [
        `${Emojis.pen} **Créateur :** ${ticket.creator_username} (\`${ticket.creator_id}\`)`,
        `${Emojis.empty}${Emojis.arrow_right} **Ouvert :** <t:${Math.floor(
          ticket.createdAt.getTime() / 1000,
        )}:R>`,
        `${Emojis.x_red} **Fermé par :** ${ticket.closed_username} (\`${ticket.closed_id}\`)`,
        `${Emojis.empty}${Emojis.arrow_right} **Fermé :** <t:${Math.floor(
          ticket.updatedAt.getTime() / 1000,
        )}:R>`,
        `${Emojis.wave} **Claim par :** ${
          ticket.claimed
            ? `${ticket.claimed_username} (\`${ticket.claimed_id}\`)`
            : "Personne"
        }`,
        "",
        `${Emojis.speechmessage} **Messages :** ${ticketMessages?.length || 0}`,
        `${Emojis.pin} **Objet :** ${ticket.label}`,
      ].join("\n"),
    );

  let userMessaged = false;

  try {
    const user = await interaction.guild?.members.fetch(ticket.creator_id);
    await user?.send({
      embeds: [embed],
      files: [attachment],
    });
    userMessaged = true;
  } catch (ignored) {}

  await archiveChannel.send({
    content: userMessaged
      ? `${Emojis.check_mark_green} **${ticket.creator_username}** a été notifié en privé.`
      : `${Emojis.x_red} **${ticket.creator_username}** n'a pas été notifié en privé.`,
    embeds: [embed],
    files: [attachment],
  });
}

export async function ticketLock(interaction: ButtonInteraction, ticket: any) {
  ticket.locked = !ticket.locked;
  await ticket.save();

  await interaction.deleteReply();
  await interaction.channel?.send({
    embeds: [
      successEmbed(
        `Ce ticket a été ${
          ticket.locked ? "verrouillé" : "déverrouillé"
        } par **${cleanUsername(interaction.user)}**.`,
      ),
    ],
  });
}

export async function ticketAddUser(
  interaction: UserSelectMenuInteraction | ButtonInteraction,
  ticket: any,
) {
  if (interaction.isButton()) {
    const userMenu = new UserSelectMenuBuilder()
      .setCustomId(`ticketAddUser-${ticket._id}`)
      .setMaxValues(1)
      .setMinValues(0);

    return await interaction.editReply({
      content: "Sélectionnez l'utilisateur à ajouter/retirer au ticket",
      components: [
        new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(userMenu),
      ],
    });
  } else if (interaction.isUserSelectMenu()) {
    const user = interaction.values[0];

    if (!user || !user.length) return await interaction.deleteReply();

    if (ticket.added_members.includes(user)) {
      ticket.added_members.splice(ticket.added_members.indexOf(user), 1);
    } else {
      ticket.added_members.push(user);
    }

    await ticket.save();
    const channel = interaction.channel as BaseGuildTextChannel;
    await channel.permissionOverwrites.edit(user, {
      ViewChannel: ticket.added_members.includes(user),
    });

    await interaction.deleteReply();
    await interaction.channel?.send({
      content: ticket.added_members.includes(user) ? `<@${user}>` : ``,
      embeds: [
        successEmbed(
          `L'utilisateur <@${user}> a été ${
            ticket.added_members.includes(user) ? "ajouté" : "retiré"
          } avec succès !`,
        ),
      ],
    });
  }
}

export async function ticketClaim(interaction: ButtonInteraction, ticket: any) {
  if (ticket.claimed)
    return await interaction.editReply({
      embeds: [
        errorEmbed(
          `Ce ticket a déjà été claim par **${ticket.claimed_username}** !`,
        ),
      ],
    });

  ticket.claimed = true;
  ticket.claimed_id = interaction.user.id;
  ticket.claimed_username = cleanUsername(interaction.user);
  await ticket.save();

  await interaction.deleteReply();
  await interaction.channel?.send({
    embeds: [
      successEmbed(
        `Ce ticket a été ${
          ticket.claimed ? "claim" : "unclaim"
        } par **${ticket.claimed_username}**.`,
      ),
    ],
  });
}

export async function ticketOpen(interaction: ButtonInteraction) {
  const id = interaction.customId.split("-")[1];
  const label = interaction.customId.split("-")[2];

  const existingTicket = await ticketSchema.findOne({
    guild_id: interaction.guild!.id,
    creator_id: interaction.user.id,
    closed: false,
  });

  if (existingTicket)
    return await interaction.editReply({
      embeds: [
        errorEmbed(
          `Vous avez déjà un ticket ouvert (<#${existingTicket._id}>)`,
        ),
      ],
    });

  const panel = await ticketPanelSchema.findOne({
    guild_id: interaction.guild!.id,
    _id: id,
  });

  if (!panel)
    return await interaction.editReply({
      embeds: [errorEmbed("Ce panel n'existe plus. Veuillez le supprimer.")],
    });

  if (panel.paused)
    return await interaction.editReply({
      embeds: [errorEmbed("Ce panel est actuellement en pause.")],
    });

  const globalPermissionOverwrites = checkExistingRoles(
    interaction,
    await getGlobalPermissions(interaction),
  );

  let ticket_category = interaction.guild?.channels.cache.find(
    (channel) =>
      channel.name === "Tickets" && channel.type === ChannelType.GuildCategory,
  );

  if (!ticket_category) {
    ticket_category = await interaction.guild!.channels.create({
      name: "Tickets",
      reason: "Création de la catégorie pour les tickets",
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

  const isStaffTicket = await isStaff(interaction);

  if (isStaffTicket) {
    ticketPermissions = checkExistingRoles(
      interaction,
      await getElevatedPermissions(interaction, true),
    );
    ticketMentions = await getElevatedMentions(interaction);
  } else {
    ticketPermissions = checkExistingRoles(
      interaction,
      await getGlobalPermissions(interaction, true),
    );
    ticketMentions = await getNormalMentions(interaction);
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
    guild_id: interaction.guild!.id,
    type: isStaffTicket ? "staff" : "user",
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
          interaction.user,
        )}** (\`${interaction.user.id}\`)`,
        "",
        `${Emojis.exclamation_mark_orange} **Renseignez les informations suivantes :**`,
        "Une description de votre demande et votre pseudo en jeu.",
        "",
        `${Emojis.exclamation_mark_red} **Attention :**`,
        "Sans réponse de votre part pendant 24 heures, votre ticket sera fermé.",
      ].join("\n"),
    );

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticketClose-${ticket._id}`)
      .setEmoji(Emojis.x_red)
      .setLabel("Fermer")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`ticketLock-${ticket._id}`)
      .setEmoji(Emojis.lock)
      .setLabel("Verrouiller")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`ticketAddUser-${ticket._id}`)
      .setEmoji(Emojis.plus)
      .setLabel("Ajouter")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`ticketClaim-${ticket._id}`)
      .setEmoji(Emojis.wave)
      .setLabel("Claim")
      .setStyle(ButtonStyle.Secondary),
  );

  await channel?.send({
    content: ticketMentions.join(" "),
    embeds: [embed],
    components: [buttons],
  });

  await interaction.editReply({
    embeds: [
      successEmbed(
        `Votre ticket a été créé avec succès <#${channel!.id}>\n(ID: \`${
          ticket._id
        }\`)`,
      ),
    ],
  });
}
