import { errorEmbed } from "../utils/embed";
import { pollCreate } from "./poll/actions";
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
      }
    }
  },
};
