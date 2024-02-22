import ticketPanelSchema from "../models/ticket-panel.schema";
import { errorEmbed, successEmbed } from "../utils/embed";
import { Emojis } from "../utils/emojis";
import { cleanUsername } from "../utils/user";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  Events,
  Interaction,
} from "discord.js";

const defaultStyles: { [key: string]: number } = {
  bleu: ButtonStyle.Primary,
  gris: ButtonStyle.Secondary,
  vert: ButtonStyle.Success,
  rouge: ButtonStyle.Danger,
};

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isModalSubmit() || !interaction.channel) return;
    if (interaction.customId !== "ticket-panel-creation") return;

    await interaction.deferReply({ ephemeral: true });

    const subject = interaction.fields.getTextInputValue("subject");
    const rawButtons = interaction.fields.getTextInputValue("buttons");
    const rawStyles = interaction.fields.getTextInputValue("styles");

    const buttons = rawButtons
      .split(",")
      .map((button) => button.trim().slice(0, 25))
      .filter((button) => button.length > 0);

    const styles = rawStyles
      .toLowerCase()
      .split(",")
      .map((style) => style.trim())
      .filter((style) => style.length > 0);

    const message = await interaction.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle(`${Emojis.exclamation_mark} ${subject}`)
          .setDescription(
            [
              "Pour pouvoir discuter avec des membres du staff merci de **sélectionner** une option dans la **liste de boutons** ci-dessous.",
              "",
              `${Emojis.exclamation_mark_red} *Tous types d'abus de cette fonctionnalité sera sanctionable par notre équipe.*`,
            ].join("\n"),
          ),
      ],
    });

    try {
      await ticketPanelSchema.create({
        _id: message.id,
        guild_id: interaction.guildId,
        channel_id: interaction.channel.id,
        creator_id: interaction.user.id,
        creator_username: cleanUsername(interaction.user),
      });
    } catch (error) {
      return interaction.editReply({
        embeds: [
          errorEmbed(`Une erreur est survenue lors de la création du panel.`),
        ],
      });
    }

    const components = buttons.map((button, index) => {
      const style = defaultStyles[styles[index]] || ButtonStyle.Secondary;

      return new ButtonBuilder()
        .setCustomId(`ticketOpen-${message.id}-${button}`)
        .setLabel(button)
        .setStyle(style);
    });

    const rows = new Array<ActionRowBuilder<ButtonBuilder>>();
    let currentRow = new ActionRowBuilder<ButtonBuilder>();

    components.map((component, index) => {
      if (index % 5 === 0) {
        currentRow = new ActionRowBuilder<ButtonBuilder>();
        rows.push(currentRow);
      }

      currentRow.addComponents(component);
    });

    await message.edit({ components: rows });
    await interaction.editReply({
      embeds: [successEmbed(`Panel créé avec succès. (ID: ${message.id})`)],
    });
  },
};
