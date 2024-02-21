import archiveSchema from "../../models/archive.schema";
import ticketPanelSchema from "../../models/ticket-panel.schema";
import { successEmbed, errorEmbed } from "../../utils/embed";
import { Emojis } from "../../utils/emojis";
import {
  checkExistingRoles,
  getElevatedPermissions,
  getGlobalPermissions,
} from "../../utils/permissions";
import dayjs from "dayjs";
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  AutocompleteInteraction,
  TextChannel,
  ChannelSelectMenuBuilder,
  ChannelSelectMenuInteraction,
  ComponentType,
  ChannelType,
  EmbedBuilder,
  Colors,
} from "discord.js";

const defaultID = "Aucun panel trouvé.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Configure les panels de tickets.")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand.setName("create").setDescription("Crée un panel de ticket."),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Supprime un panel de ticket.")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("ID du panel à supprimer.")
            .setRequired(true)
            .setAutocomplete(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("pause")
        .setDescription("Met en pause un panel de ticket.")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("ID du panel à supprimer.")
            .setRequired(true)
            .setAutocomplete(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("archive")
        .setDescription("Défini les salons d'archives de tickets."),
    ),
  async autocomplete(interaction: AutocompleteInteraction) {
    const panels = await ticketPanelSchema.find({
      guild_id: interaction.guildId,
    });
    if (panels.length <= 0)
      return await interaction.respond([{ name: defaultID, value: defaultID }]);

    return await interaction.respond(
      panels.map((panel) => ({ name: panel._id, value: panel._id })),
    );
  },
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommands = interaction.options.getSubcommand();

    switch (subcommands) {
      case "create":
        {
          const modal = new ModalBuilder()
            .setCustomId("ticket-panel-creation")
            .setTitle("Ticket Panel Creation");

          const subject = new TextInputBuilder()
            .setCustomId("subject")
            .setLabel("sujet du panel")
            .setMaxLength(250)
            .setStyle(TextInputStyle.Short);

          const buttons = new TextInputBuilder()
            .setCustomId("buttons")
            .setLabel("boutons (séparés par une virgule)")
            .setPlaceholder("Support, Aide, Autre")
            .setStyle(TextInputStyle.Paragraph);

          const styes = new TextInputBuilder()
            .setCustomId("styles")
            .setLabel("styles des boutons (séparés par une virgule)")
            .setPlaceholder("rouge, vert, bleu, gris (par défaut)")
            .setRequired(false)
            .setStyle(TextInputStyle.Paragraph);

          const rows = [subject, buttons, styes].map((field) =>
            new ActionRowBuilder<TextInputBuilder>().addComponents(field),
          );

          modal.addComponents(rows[0], rows[1], rows[2]);

          await interaction.showModal(modal);
        }
        break;
      case "delete":
        {
          await interaction.deferReply({ ephemeral: true });
          const id = interaction.options.getString("id");

          if (id === defaultID)
            return await interaction.followUp({
              embeds: [errorEmbed("Veuillez à bien sélectionner un panel.")],
            });

          const panel = await ticketPanelSchema.findOneAndDelete({
            _id: id,
            guild_id: interaction.guildId,
          });
          if (!panel)
            return await interaction.followUp({
              embeds: [errorEmbed("Aucun panel trouvé avec cet ID.")],
            });

          try {
            const channel = interaction.guild?.channels.cache.get(
              panel.channel_id,
            ) as TextChannel;
            const message = await channel.messages.fetch(panel._id);

            await message.delete();
          } catch (ignored) {}

          await interaction.editReply({
            embeds: [successEmbed("Panel supprimé avec succès.")],
          });
        }
        break;
      case "pause":
        {
          await interaction.deferReply({ ephemeral: true });
          const id = interaction.options.getString("id");

          if (id === defaultID)
            return await interaction.followUp({
              embeds: [errorEmbed("Veuillez à bien sélectionner un panel.")],
            });

          const panel = await ticketPanelSchema.findOne({
            _id: id,
            guild_id: interaction.guildId,
          });
          if (!panel)
            return await interaction.followUp({
              embeds: [errorEmbed("Aucun panel trouvé avec cet ID.")],
            });

          panel.paused = !panel.paused;
          await panel.save();

          await interaction.editReply({
            embeds: [
              successEmbed(
                `Panel ${
                  panel.paused ? "mis en pause" : "relancé"
                } avec succès.`,
              ),
            ],
          });
        }
        break;
      case "archive":
        {
          await interaction.deferReply({ ephemeral: true });

          const archive = await archiveSchema.findOneAndUpdate(
            { _id: interaction.guildId },
            {},
            { upsert: true, new: true },
          );

          let user_channel = archive.user_channel;
          let staff_channel = archive.staff_channel;

          const globalPermissions = await getGlobalPermissions(interaction);
          const existingGlobalPermissions = checkExistingRoles(
            interaction,
            globalPermissions,
          );
          const elevatedPermissions = await getElevatedPermissions(interaction);
          const existingElevatedPermissions = checkExistingRoles(
            interaction,
            elevatedPermissions,
          );

          const createChannelSelector = (customId: string) => {
            return new ChannelSelectMenuBuilder()
              .setCustomId(customId)
              .setChannelTypes(ChannelType.GuildText)
              .setMaxValues(1)
              .setMinValues(0);
          };

          const userChannelSelector = createChannelSelector("user-channel");
          const staffChannelSelector = createChannelSelector("staff-channel");

          const rows = [userChannelSelector, staffChannelSelector].map(
            (field) =>
              new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                field,
              ),
          );

          const start = dayjs().add(15, "seconds");

          const buildEmbed = () => {
            return new EmbedBuilder()
              .setColor(Colors.Blurple)
              .setDescription(
                [
                  `Choisissez dans la liste de salons disponibles, vous avez <t:${start.unix()}:R>`,
                  "",
                  `${Emojis.blue_hexagon} Salon utilisateur: <#${user_channel}>`,
                  `${Emojis.blue_hexagon} Salon staff: <#${staff_channel}>`,
                ].join("\n"),
              );
          };

          const message = await interaction.editReply({
            embeds: [buildEmbed()],
            components: rows,
          });

          const updateEmbed = (isUserChannel: boolean) => {
            return buildEmbed().setDescription(
              [
                `Choisissez dans la liste de salons disponibles, vous avez <t:${start.unix()}:R>`,
                "",
                `${
                  isUserChannel ? Emojis.check_mark_green : Emojis.blue_hexagon
                } Salon utilisateur: <#${user_channel}>`,
                `${
                  isUserChannel ? Emojis.blue_hexagon : Emojis.check_mark_green
                } Salon staff: <#${staff_channel}>`,
              ].join("\n"),
            );
          };

          const updateDatabaseAndMessage = async (
            i: ChannelSelectMenuInteraction,
            isUserChannel: boolean,
          ) => {
            await Promise.all([
              archiveSchema.updateOne(
                { _id: interaction.guildId },
                {
                  [isUserChannel ? "user_channel" : "staff_channel"]:
                    i.values[0] === undefined ? null : i.values[0],
                },
              ),
              i.update({ embeds: [updateEmbed(isUserChannel)] }),
            ]);
          };

          const collector = message.createMessageComponentCollector({
            componentType: ComponentType.ChannelSelect,
            time: 15_000,
          });

          collector.on("collect", async (i) => {
            const newValues = i.values[0] === undefined ? null : i.values[0];

            if (i.customId === "user-channel") {
              user_channel = newValues;
              await updateDatabaseAndMessage(i, true);
            } else if (i.customId === "staff-channel") {
              staff_channel = newValues;
              await updateDatabaseAndMessage(i, false);
            }
          });

          collector.on("end", async () => {
            await interaction.guild?.channels.cache.get(user_channel)?.edit({
              permissionOverwrites: existingGlobalPermissions,
            });

            await interaction.guild?.channels.cache.get(staff_channel)?.edit({
              permissionOverwrites: existingElevatedPermissions,
            });

            await interaction.editReply({
              components: [],
            });
          });
        }
        break;
    }
  },
};
