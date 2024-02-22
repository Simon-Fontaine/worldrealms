import archiveSchema from "../models/archive.schema";
import ticketSchema from "../models/ticket.schema";
import { errorEmbed, successEmbed } from "../utils/embed";
import { Emojis } from "../utils/emojis";
import { cleanUsername, isStaff } from "../utils/user";
import dayjs, { Dayjs } from "dayjs";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  BaseGuildTextChannel,
  Colors,
  EmbedBuilder,
  Events,
  Interaction,
  User,
  UserSelectMenuBuilder,
} from "discord.js";

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isButton() && !interaction.isUserSelectMenu()) return;
    if (!interaction.channel || !interaction.guild) return;

    const [type, id] = interaction.customId.split("-");
    const types = ["ticketClose", "ticketLock", "ticketAddUser", "ticketClaim"];
    if (!types.includes(type)) return;

    await interaction.deferReply({ ephemeral: true });
    const canExecute = await isStaff(interaction);

    if (!canExecute)
      return await interaction.editReply({
        embeds: [
          errorEmbed("Vous n'avez pas la permission d'effectuer cette action."),
        ],
      });

    const ticket = await ticketSchema.findOne({
      guild_id: interaction.guild.id,
      _id: id,
    });
    if (!ticket)
      return await interaction.editReply({
        embeds: [errorEmbed("Ce ticket n'existe plus.")],
      });

    if (ticket.closed)
      return await interaction.editReply({
        embeds: [errorEmbed("Ce ticket est  en cours de fermeture.")],
      });

    switch (type) {
      case "ticketClose":
        {
          ticket.closed = true;
          ticket.closed_id = interaction.user.id;
          ticket.closed_username = cleanUsername(interaction.user);
          await ticket.save();

          await interaction.channel.send({
            embeds: [
              successEmbed(
                `Ce ticket a été fermé par **${cleanUsername(
                  interaction.user,
                )}**. Il sera archivé dans quelques secondes.`,
              ),
            ],
          });

          await interaction.editReply({
            embeds: [
              successEmbed(
                "Vous avez fermé ce ticket. Il sera archivé dans quelques secondes.",
              ),
            ],
          });

          setTimeout(async () => {
            await interaction.channel?.delete();
          }, 10000);

          const archive = await archiveSchema.findOne({
            _id: interaction.guild.id,
          });
          const archiveChannel = interaction.guild.channels.cache.get(
            ticket.type === "user"
              ? archive.user_channel
              : archive.staff_channel,
          ) as BaseGuildTextChannel;

          if (!archiveChannel)
            return await interaction.editReply({
              embeds: [errorEmbed("Aucun channel d'archive n'a été trouvé.")],
            });

          let ticketContent;
          try {
            ticketContent = await interaction.channel.messages.fetch({
              cache: false,
            });
          } catch (ignored) {}

          const formatMessage = (
            message: string,
            user: User,
            timestamp: number | Dayjs = dayjs(),
          ) => {
            if (typeof timestamp === "number") timestamp = dayjs(timestamp);

            return `[${timestamp.format("DD/MM/YYYY HH:mm")}] ${cleanUsername(
              user,
            )} : ${message}`;
          };

          if (ticketContent) {
            ticketContent = ticketContent
              .reverse()
              .filter((message) => !message.author.bot)
              .map((message) =>
                formatMessage(
                  message.content,
                  message.author,
                  message.createdTimestamp,
                ),
              );
          } else {
            ticketContent = [
              formatMessage("Aucun message", interaction.client.user),
            ];
          }

          if (ticketContent.length === 0) {
            ticketContent = [
              formatMessage("Aucun message", interaction.client.user),
            ];
          }

          const attachment = new AttachmentBuilder(
            Buffer.from(ticketContent.join("\n"), "utf-8"),
            {
              name: `ticket-${id}.txt`,
            },
          );

          const embed = new EmbedBuilder()
            .setTitle(`${Emojis.exclamation_mark_orange} Ticket #${id}`)
            .setColor(Colors.Blurple)
            .setDescription(
              [
                `${Emojis.pen} **Créateur :** ${ticket.creator_username} (\`${ticket.creator_id}\`)`,
                `${Emojis.empty}${
                  Emojis.arrow_right
                } **Ouvert :** <t:${Math.floor(
                  ticket.createdAt.getTime() / 1000,
                )}:R>`,
                `${Emojis.x_red} **Fermé par :** ${ticket.closed_username} (\`${ticket.closed_id}\`)`,
                `${Emojis.empty}${
                  Emojis.arrow_right
                } **Fermé :** <t:${Math.floor(
                  ticket.updatedAt.getTime() / 1000,
                )}:R>`,
                `${Emojis.wave} **Claim par :** ${
                  ticket.claimed
                    ? `${ticket.claimed_username} (\`${ticket.claimed_id}\`)`
                    : "Personne"
                }`,
                "",
                `${Emojis.speechmessage} **Messages :** ${ticketContent.length}`,
                `${Emojis.pin} **Objet :** ${ticket.label}`,
              ].join("\n"),
            );

          let userMessaged = false;

          try {
            const user = await interaction.guild.members.fetch(
              ticket.creator_id,
            );
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
        break;
      case "ticketLock":
        {
          ticket.locked = !ticket.locked;
          await ticket.save();

          const channel = interaction.channel as BaseGuildTextChannel;
          await channel.permissionOverwrites.edit(
            interaction.guild.roles.everyone.id,
            {
              SendMessages: !ticket.locked,
            },
          );

          await interaction.channel.send({
            embeds: [
              successEmbed(
                `Ce ticket a été ${
                  ticket.locked ? "verrouillé" : "déverrouillé"
                } par **${cleanUsername(interaction.user)}**.`,
              ),
            ],
          });

          await interaction.editReply({
            embeds: [
              successEmbed(
                `Vous avez ${
                  ticket.locked ? "verrouillé" : "déverrouillé"
                } ce ticket.`,
              ),
            ],
          });
        }
        break;
      case "ticketAddUser":
        {
          if (interaction.isButton()) {
            const userMenu = new UserSelectMenuBuilder()
              .setCustomId(`ticketAddUser-${id}`)
              .setMaxValues(1)
              .setMinValues(1);

            return await interaction.editReply({
              content: "Sélectionnez l'utilisateur à ajouter/retirer au ticket",
              components: [
                new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
                  userMenu,
                ),
              ],
            });
          } else if (interaction.isUserSelectMenu()) {
            const user = interaction.values[0];

            if (ticket.added_members.includes(user)) {
              ticket.added_members.splice(
                ticket.added_members.indexOf(user),
                1,
              );
            } else {
              ticket.added_members.push(user);
            }

            await ticket.save();
            const channel = interaction.channel as BaseGuildTextChannel;
            await channel.permissionOverwrites.edit(user, {
              ViewChannel: ticket.added_members.includes(user),
            });

            await interaction.channel.send({
              content: ticket.added_members.includes(user) ? `<@${user}>` : ``,
              embeds: [
                successEmbed(
                  `L'utilisateur <@${user}> a été ${
                    ticket.added_members.includes(user) ? "ajouté" : "retiré"
                  } avec succès !`,
                ),
              ],
            });

            return await interaction.editReply({
              embeds: [
                successEmbed(
                  `Vous avez ${
                    ticket.added_members.includes(user) ? "ajouté" : "retiré"
                  } l'utilisateur <@${user}> avec succès !`,
                ),
              ],
            });
          }
        }
        break;
      case "ticketClaim":
        {
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

          await interaction.channel.send({
            embeds: [
              successEmbed(
                `Ce ticket a été pris en charge par **${cleanUsername(
                  interaction.user,
                )}**.`,
              ),
            ],
          });

          await interaction.editReply({
            embeds: [successEmbed(`Vous avez pris en charge ce ticket.`)],
          });
        }
        break;
    }
  },
};
