import roleSchema from "../../models/role.schema";
import userSchema from "../../models/user.schema";
import { errorEmbed, successEmbed } from "../../utils/embed";
import { cleanUsername } from "../../utils/user";
import { EmbedBuilder } from "@discordjs/builders";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Colors,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

const defaultRole = "Aucun rôle trouvé.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("staff")
    .setDescription("Ajoute, liste ou supprime un membre du staff.")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option
        .setName("membre")
        .setDescription("Membre à ajouter ou supprimer.")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("role")
        .setDescription("Rôle à ajouter ou supprimer.")
        .setRequired(false)
        .setAutocomplete(true),
    ),
  async autocomplete(interaction: AutocompleteInteraction) {
    const roles = await roleSchema.find({ guild_id: interaction.guildId });
    if (roles.length <= 0) {
      return await interaction.respond([
        { name: defaultRole, value: defaultRole },
      ]);
    }

    return await interaction.respond(
      roles.map((role) => ({ name: role.name, value: role._id })),
    );
  },
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser("membre");
    const role = interaction.options.getString("role");
    const roles = await roleSchema.find({ guild_id: interaction.guildId });

    if (roles.length <= 0) {
      return await interaction.editReply({
        embeds: [errorEmbed("Aucun rôle trouvé dans la base de données.")],
      });
    }

    if (!user) {
      const members = await userSchema.find({ guild_id: interaction.guildId });

      if (members.length <= 0) {
        return await interaction.editReply({
          embeds: [errorEmbed("Aucun membre trouvé dans la base de données.")],
        });
      }

      const staffList = members
        .sort((a, b) => {
          const roleA = roles.find((r) => r._id === a.role);
          const roleB = roles.find((r) => r._id === b.role);

          if (!roleA || !roleB) return 0;

          return roleB.weight - roleA.weight;
        })
        .map((member) => `- <@${member.user_id}> : <@&${member.role}>`)
        .join("\n");

      const embed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setDescription(staffList);

      return await interaction.editReply({
        embeds: [embed],
      });
    }

    const member = interaction.guild!.members.cache.get(user.id);
    if (!member) {
      return await interaction.editReply({
        embeds: [errorEmbed("Membre introuvable sur le serveur.")],
      });
    }

    try {
      await member.roles.remove(roles.map((role) => role._id));
    } catch (ignored) {}

    if (!role) {
      const memberData = await userSchema.findOneAndDelete({
        user_id: user.id,
        guild_id: interaction.guildId,
      });
      if (!memberData) {
        return await interaction.editReply({
          embeds: [errorEmbed("Membre introuvable dans la base de données.")],
        });
      }

      return await interaction.editReply({
        embeds: [
          successEmbed(`Membre ${user} supprimé de la base de données.`),
        ],
      });
    }

    const roleData = roles.find((r) => r._id === role);
    if (!roleData) {
      return await interaction.editReply({
        embeds: [errorEmbed("Rôle introuvable dans la base de données.")],
      });
    }

    try {
      await member.roles.add(roleData._id);
    } catch (ignored) {}

    await userSchema.findOneAndUpdate(
      {
        user_id: user.id,
        guild_id: interaction.guildId,
      },
      {
        user_id: user.id,
        guild_id: interaction.guildId,
        avatar:
          user.avatarURL({
            forceStatic: false,
          }) || undefined,
        created_at: user.createdAt,
        name: cleanUsername(user),
        role: role,
      },
      { upsert: true, new: true },
    );

    return await interaction.editReply({
      embeds: [successEmbed(`Membre ${user} ajouté au rôle <@&${role}>.`)],
    });
  },
};
