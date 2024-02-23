import pollSchema from "../../models/poll.schema";
import { errorEmbed } from "../../utils/embed";
import { formatTime } from "../../utils/time";
import dayjs from "dayjs";
import {
  ActionRowBuilder,
  AutocompleteInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

const defaultID = "Aucun sondage trouvé.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("polls")
    .setDescription("Configure les sondages.")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand.setName("create").setDescription("Crée un sondage."),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("end")
        .setDescription("Termine un sondage.")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("ID du sondage à terminer.")
            .setRequired(true)
            .setAutocomplete(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Supprime un sondage.")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("ID du sondage à supprimer.")
            .setRequired(true)
            .setAutocomplete(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("Liste les sondages.")
        .addStringOption((option) =>
          option
            .setName("status")
            .setDescription("Statut du sondage.")
            .setRequired(false)
            .addChoices(
              { name: "Tous", value: "tous" },
              { name: "En cours", value: "en_cours" },
              { name: "Terminé", value: "termine" },
            ),
        )
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("ID du sondage.")
            .setRequired(false)
            .setAutocomplete(true),
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Salon où le sondage a été créé.")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        )
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Utilisateur ayant créé le sondage.")
            .setRequired(false),
        ),
    ),
  async autocomplete(interaction: AutocompleteInteraction) {
    const polls = await pollSchema.find({
      guild_id: interaction.guildId,
    });

    if (polls.length <= 0)
      return await interaction.respond([{ name: defaultID, value: defaultID }]);

    return await interaction.respond(
      polls.map((poll) => ({ name: poll._id, value: poll._id })),
    );
  },
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommands = interaction.options.getSubcommand();

    switch (subcommands) {
      case "create":
        {
          const pollLimit = 10;
          const pollCount = await pollSchema.countDocuments({
            guild_id: interaction.guildId,
          });

          if (pollCount >= pollLimit)
            return await interaction.reply({
              embeds: [
                errorEmbed(
                  `Vous avez atteint la limite de sondages (${pollLimit}).`,
                ),
              ],
              ephemeral: true,
            });

          const date = formatTime(dayjs().add(1, "hour").toDate());

          const modal = new ModalBuilder()
            .setCustomId(`pollCreate`)
            .setTitle("Créer un sondage");

          const question = new TextInputBuilder()
            .setCustomId("question")
            .setLabel("Question (Requis)")
            .setPlaceholder("Quelle est votre question ?")
            .setMaxLength(256)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

          const duration = new TextInputBuilder()
            .setCustomId("duration")
            .setLabel("Durée (Optionnel)")
            .setPlaceholder(`e.g ${date.small}`)
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

          const firstChoice = new TextInputBuilder()
            .setCustomId("firstChoice")
            .setLabel("Premier choix (Requis)")
            .setPlaceholder("Premier choix")
            .setMaxLength(50)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const secondChoice = new TextInputBuilder()
            .setCustomId("secondChoice")
            .setLabel("Deuxième choix (Requis)")
            .setPlaceholder("Deuxième choix")
            .setMaxLength(50)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const otherChoices = new TextInputBuilder()
            .setCustomId("otherChoices")
            .setLabel("Autres choix (Optionnel)")
            .setPlaceholder("Autres choix, un par ligne. (max 18)")
            .setMaxLength(800)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

          const rows = [
            question,
            duration,
            firstChoice,
            secondChoice,
            otherChoices,
          ].map((field) =>
            new ActionRowBuilder<TextInputBuilder>().addComponents(field),
          );

          modal.addComponents(...rows);

          await interaction.showModal(modal);
        }
        break;
    }
  },
};
