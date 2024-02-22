import archiveSchema from "../models/archive.schema";
import { SchemaArchive } from "../types";
import { archiveEmbed, errorEmbed } from "../utils/embed";
import { Events, Interaction, MessageComponentInteraction } from "discord.js";

const editArchiveConfig = async (
  interaction: Interaction,
  fields: Partial<SchemaArchive>,
): Promise<SchemaArchive> => {
  return await archiveSchema.findOneAndUpdate(
    {
      _id: interaction.guildId,
    },
    {
      _id: interaction.guildId,
      ...fields,
    },
    {
      upsert: true,
      new: true,
    },
  );
};

const editArchiveMessage = async (
  interaction: MessageComponentInteraction,
  archiveConfig: SchemaArchive,
): Promise<void> => {
  try {
    await interaction.message?.edit({
      embeds: [archiveEmbed(archiveConfig)],
    });
  } catch (error) {
    await interaction.editReply({
      embeds: [errorEmbed("Une erreur est survenue lors de la mise à jour.")],
    });
  }
};

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isButton() && !interaction.isAnySelectMenu()) return;
    if (!interaction.guild || !interaction.channel) return;

    const [type, userId] = interaction.customId.split("-");
    const types = [
      "panelArchivePermission",
      "panelArchiveEdit",
      "panelArchiveReset",
      "panelArchiveUser",
      "panelArchiveStaff",
    ];
    if (!types.includes(type)) return;

    if (!types.includes(type)) return;
    if (userId !== interaction.user.id) {
      return interaction.reply({
        embeds: [
          errorEmbed("Vous n'avez pas la permission de modifier ce message."),
        ],
        ephemeral: true,
      });
    }

    switch (type) {
    }
  },
};
