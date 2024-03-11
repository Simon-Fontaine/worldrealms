import { errorEmbed } from "../utils/embed";
import {
  pollAllowedRoles,
  pollCancel,
  pollConfirm,
  pollCreate,
  pollList,
  pollMaxChoices,
  pollVote,
} from "./poll/actions";
import { Events, Interaction } from "discord.js";

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (
      !interaction.isButton() &&
      !interaction.isAnySelectMenu() &&
      !interaction.isModalSubmit()
    )
      return;

    const [actionName, userId] = interaction.customId.split("-");

    if (actionName === "pollVote") {
      interaction.client.logger.debug("pollVote");
      if (!interaction.isButton()) return;
      return await pollVote(interaction);
    }

    if (actionName.startsWith("poll")) {
      if (userId !== interaction.user.id) {
        return interaction.reply({
          embeds: [
            errorEmbed("Vous n'avez pas la permission de modifier ce message."),
          ],
          ephemeral: true,
        });
      }

      switch (actionName) {
        case "pollCreate":
          interaction.client.logger.debug("pollCreate");
          if (!interaction.isModalSubmit()) return;
          await pollCreate(interaction);
          break;
        case "pollConfirm":
          interaction.client.logger.debug("pollConfirm");
          if (!interaction.isButton()) return;
          await pollConfirm(interaction);
          break;
        case "pollCancel":
          interaction.client.logger.debug("pollCancel");
          if (!interaction.isButton()) return;
          await pollCancel(interaction);
          break;
        case "pollAllowedRoles":
          interaction.client.logger.debug("pollAllowedRoles");
          if (!interaction.isRoleSelectMenu()) return;
          await pollAllowedRoles(interaction);
          break;
        case "pollMaxChoices":
          interaction.client.logger.debug("pollMaxChoices");
          if (!interaction.isStringSelectMenu()) return;
          await pollMaxChoices(interaction);
          break;
        case "pollList":
          interaction.client.logger.debug("pollList");
          if (!interaction.isStringSelectMenu()) return;
          await pollList(interaction);
          break;
      }
    }
  },
};
