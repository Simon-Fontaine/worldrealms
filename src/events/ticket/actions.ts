import archiveSchema from "../../models/archive.schema";
import ticketPanelSchema from "../../models/ticket-panel.schema";
import { SchemaTicket } from "../../types";
import { errorEmbed, successEmbed } from "../../utils/embed";
import { Emojis } from "../../utils/emojis";
import { cleanUsername } from "../../utils/user";
import dayjs from "dayjs";
import {
  AttachmentBuilder,
  BaseGuildTextChannel,
  ButtonInteraction,
  Colors,
  EmbedBuilder,
  Interaction,
  Message,
} from "discord.js";

const editTicketConfig = async (
  id: string,
  interaction: Interaction,
  fields: Partial<SchemaTicket>,
): Promise<SchemaTicket> => {
  return await ticketPanelSchema.findOneAndUpdate(
    {
      _id: id,
      guild_id: interaction.guildId,
    },
    {
      _id: id,
      ...fields,
    },
    {
      upsert: true,
      new: true,
    },
  );
};

const ticketClose = async (interaction: ButtonInteraction, id: string) => {
  await interaction.deferUpdate();

  const ticketConfig = await editTicketConfig(id, interaction, {
    closed: true,
    closed_id: interaction.user.id,
    closed_username: cleanUsername(interaction.user),
  });

  await interaction.channel?.send({
    embeds: [
      successEmbed(
        `Ce ticket a été fermé par **${ticketConfig.closed_username}**. Il sera archivé dans quelques secondes.`,
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
    ticketConfig.type === "user" ? archive.user_channel : archive.staff_channel,
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
    ticketMessages?.join("\n") || "Aucun message",
    {
      name: `ticket-${id}.txt`,
    },
  );

  const embed = new EmbedBuilder()
    .setTitle(`${Emojis.exclamation_mark_orange} Ticket #${id}`)
    .setColor(Colors.Blurple)
    .setDescription(
      [
        `${Emojis.pen} **Créateur :** ${ticketConfig.creator_username} (\`${ticketConfig.creator_id}\`)`,
        `${Emojis.empty}${Emojis.arrow_right} **Ouvert :** <t:${Math.floor(
          ticketConfig.createdAt.getTime() / 1000,
        )}:R>`,
        `${Emojis.x_red} **Fermé par :** ${ticketConfig.closed_username} (\`${ticketConfig.closed_id}\`)`,
        `${Emojis.empty}${Emojis.arrow_right} **Fermé :** <t:${Math.floor(
          ticketConfig.updatedAt.getTime() / 1000,
        )}:R>`,
        `${Emojis.wave} **Claim par :** ${
          ticketConfig.claimed
            ? `${ticketConfig.claimed_username} (\`${ticketConfig.claimed_id}\`)`
            : "Personne"
        }`,
        "",
        `${Emojis.speechmessage} **Messages :** ${ticketMessages?.length || 0}`,
        `${Emojis.pin} **Objet :** ${ticketConfig.label}`,
      ].join("\n"),
    );

  let userMessaged = false;

  try {
    const user = await interaction.guild?.members.fetch(
      ticketConfig.creator_id,
    );
    await user?.send({
      embeds: [embed],
      files: [attachment],
    });
    userMessaged = true;
  } catch (ignored) {}

  await archiveChannel.send({
    content: userMessaged
      ? `${Emojis.check_mark_green} **${ticketConfig.creator_username}** a été notifié en privé.`
      : `${Emojis.x_red} **${ticketConfig.creator_username}** n'a pas été notifié en privé.`,
    embeds: [embed],
    files: [attachment],
  });
};

// TODO: add the rest of the code