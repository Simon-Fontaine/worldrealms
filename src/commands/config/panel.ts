import archiveSchema from "../../models/archive.schema";
import ticketPanelSchema from "../../models/ticket-panel.schema";
import { archiveEmbed, errorEmbed, successEmbed } from "../../utils/embed";
import { Emojis } from "../../utils/emojis";
import {
  ActionRowBuilder,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
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

          modal.addComponents(...rows);

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
          await interaction.deferReply({});

          const archive = await archiveSchema.findOneAndUpdate(
            { _id: interaction.guildId },
            {},
            { upsert: true, new: true },
          );

          const firstActionRow =
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`panelArchivePermission-${interaction.user.id}`)
                .setLabel("Applique les permissions")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`panelArchiveEdit-${interaction.user.id}`)
                .setLabel("Fermer")
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`panelArchiveReset-${interaction.user.id}`)
                .setLabel("Réinitialiser")
                .setStyle(ButtonStyle.Danger),
            );

          const secondActionRow =
            new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
              new ChannelSelectMenuBuilder()
                .setCustomId(`panelArchiveUser-${interaction.user.id}`)
                .setChannelTypes(ChannelType.GuildText)
                .setMaxValues(1)
                .setMinValues(0),
            );

          const thirdActionRow =
            new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
              new ChannelSelectMenuBuilder()
                .setCustomId(`panelArchiveStaff-${interaction.user.id}`)
                .setChannelTypes(ChannelType.GuildText)
                .setMaxValues(1)
                .setMinValues(0),
            );

          await interaction.editReply({
            embeds: [archiveEmbed(archive)],
            components: [firstActionRow, secondActionRow, thirdActionRow],
          });
        }
        break;
    }
  },
};
