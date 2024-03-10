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
      console.log("pollVote");
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
          console.log("pollCreate");
          if (!interaction.isModalSubmit()) return;
          await pollCreate(interaction);
          break;
        case "pollConfirm":
          console.log("pollConfirm");
          if (!interaction.isButton()) return;
          await pollConfirm(interaction);
          break;
        case "pollCancel":
          console.log("pollCancel");
          if (!interaction.isButton()) return;
          await pollCancel(interaction);
          break;
        case "pollAllowedRoles":
          console.log("pollAllowedRoles");
          if (!interaction.isRoleSelectMenu()) return;
          await pollAllowedRoles(interaction);
          break;
        case "pollMaxChoices":
          console.log("pollMaxChoices");
          if (!interaction.isStringSelectMenu()) return;
          await pollMaxChoices(interaction);
          break;
        case "pollList":
          console.log("pollList");
          if (!interaction.isStringSelectMenu()) return;
          await pollList(interaction);
          break;
      }
    }
  },
};
