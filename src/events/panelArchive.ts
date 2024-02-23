import archiveSchema from "../models/archive.schema";
import { SchemaArchive } from "../types";
import { archiveEmbed, errorEmbed, successEmbed } from "../utils/embed";
import {
  checkExistingRoles,
  getElevatedPermissions,
  getGlobalPermissions,
} from "../utils/permissions";
import {
  Events,
  Interaction,
  MessageComponentInteraction,
  TextChannel,
} from "discord.js";

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
    await interaction.followUp({
      embeds: [errorEmbed("Une erreur est survenue lors de la mise à jour.")],
      ephemeral: true,
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
      "panelArchiveClose",
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

    await interaction.deferUpdate();
    const archiveConfig = await editArchiveConfig(interaction, {});

    switch (type) {
      case "panelArchivePermission":
        if (!interaction.isButton()) return;
        if (!archiveConfig.staff_channel && !archiveConfig.user_channel) {
          return interaction.followUp({
            embeds: [errorEmbed("Veuillez configurer les salons.")],
            ephemeral: true,
          });
        }

        const staffChannel = interaction.guild.channels.cache.get(
          archiveConfig.staff_channel,
        ) as TextChannel | undefined;
        const userChannel = interaction.guild.channels.cache.get(
          archiveConfig.user_channel,
        ) as TextChannel | undefined;

        if (!staffChannel && !userChannel) {
          return interaction.followUp({
            embeds: [errorEmbed("Un de vos salons configurés n'existent pas.")],
            ephemeral: true,
          });
        }

        if (staffChannel) {
          const elevatedPermissions = checkExistingRoles(
            interaction,
            await getElevatedPermissions(interaction),
          );

          await staffChannel.edit({
            permissionOverwrites: elevatedPermissions,
          });
        }
        if (userChannel) {
          const globalPermissions = checkExistingRoles(
            interaction,
            await getGlobalPermissions(interaction),
          );

          await userChannel.edit({
            permissionOverwrites: globalPermissions,
          });
        }

        await interaction.followUp({
          embeds: [successEmbed("Les permissions ont été mises à jour.")],
          ephemeral: true,
        });
        break;
      case "panelArchiveClose":
        if (!interaction.isButton()) return;
        await interaction.message?.delete().catch(() => null);
        break;
      case "panelArchiveReset":
        if (!interaction.isButton()) return;
        archiveConfig.staff_channel = "undefined";
        archiveConfig.user_channel = "undefined";

        await editArchiveConfig(interaction, archiveConfig);
        await editArchiveMessage(interaction, archiveConfig);
        break;
      case "panelArchiveUser":
        if (!interaction.isChannelSelectMenu()) return;
        archiveConfig.user_channel = interaction.values[0];

        await editArchiveConfig(interaction, archiveConfig);
        await editArchiveMessage(interaction, archiveConfig);
        break;
      case "panelArchiveStaff":
        if (!interaction.isChannelSelectMenu()) return;
        archiveConfig.staff_channel = interaction.values[0];

        await editArchiveConfig(interaction, archiveConfig);
        await editArchiveMessage(interaction, archiveConfig);
        break;
    }
  },
};
