import { errorEmbed } from "../utils/embed";
import {
  leaveMessageChannelSelect,
  leaveMessageClose,
  leaveMessageEdit,
  leaveMessageModal,
  leaveMessageReset,
  leaveMessageVariables,
} from "./leave/actions";
import {
  panelArchiveClose,
  panelArchiveModal,
  panelArchivePermission,
  panelArchiveReset,
  panelArchiveStaff,
  panelArchiveUser,
} from "./panel/actions";
import {
  welcomeMessageChannelSelect,
  welcomeMessageClose,
  welcomeMessageEdit,
  welcomeMessageModal,
  welcomeMessageReset,
  welcomeMessageRoleSelect,
  welcomeMessageUserPing,
  welcomeMessageVariables,
} from "./welcome/actions";
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

    if (actionName.startsWith("welcomeMessage")) {
      if (userId !== interaction.user.id) {
        return interaction.reply({
          embeds: [
            errorEmbed("Vous n'avez pas la permission de modifier ce message."),
          ],
          ephemeral: true,
        });
      }

      switch (actionName) {
        case "welcomeMessageModal":
          console.log("welcomeMessageModal");
          if (!interaction.isButton()) return;
          await welcomeMessageModal(interaction);
          break;
        case "welcomeMessageEdit":
          console.log("welcomeMessageEdit");
          if (!interaction.isModalSubmit()) return;
          await welcomeMessageEdit(interaction);
          break;
        case "welcomeMessageUserPing":
          console.log("welcomeMessageUserPing");
          if (!interaction.isButton()) return;
          await welcomeMessageUserPing(interaction);
          break;
        case "welcomeMessageVariables":
          console.log("welcomeMessageVariables");
          if (!interaction.isButton()) return;
          await welcomeMessageVariables(interaction);
          break;
        case "welcomeMessageClose":
          console.log("welcomeMessageClose");
          if (!interaction.isButton()) return;
          await welcomeMessageClose(interaction);
          break;
        case "welcomeMessageReset":
          console.log("welcomeMessageReset");
          if (!interaction.isButton()) return;
          await welcomeMessageReset(interaction);
          break;
        case "welcomeMessageChannelSelect":
          console.log("welcomeMessageChannelSelect");
          if (!interaction.isChannelSelectMenu()) return;
          await welcomeMessageChannelSelect(interaction);
          break;
        case "welcomeMessageRoleSelect":
          console.log("welcomeMessageRoleSelect");
          if (!interaction.isRoleSelectMenu()) return;
          await welcomeMessageRoleSelect(interaction);
          break;
      }
    } else if (actionName.startsWith("leaveMessage")) {
      if (userId !== interaction.user.id) {
        return interaction.reply({
          embeds: [
            errorEmbed("Vous n'avez pas la permission de modifier ce message."),
          ],
          ephemeral: true,
        });
      }

      switch (actionName) {
        case "leaveMessageModal":
          console.log("leaveMessageModal");
          if (!interaction.isButton()) return;
          await leaveMessageModal(interaction);
          break;
        case "leaveMessageEdit":
          console.log("leaveMessageEdit");
          if (!interaction.isModalSubmit()) return;
          await leaveMessageEdit(interaction);
          break;
        case "leaveMessageVariables":
          console.log("leaveMessageVariables");
          if (!interaction.isButton()) return;
          await leaveMessageVariables(interaction);
          break;
        case "leaveMessageClose":
          console.log("leaveMessageClose");
          if (!interaction.isButton()) return;
          await leaveMessageClose(interaction);
          break;
        case "leaveMessageReset":
          console.log("leaveMessageReset");
          if (!interaction.isButton()) return;
          await leaveMessageReset(interaction);
          break;
        case "leaveMessageChannelSelect":
          console.log("leaveMessageChannelSelect");
          if (!interaction.isChannelSelectMenu()) return;
          await leaveMessageChannelSelect(interaction);
          break;
      }
    } else if (actionName.startsWith("panelArchive")) {
      if (userId !== interaction.user.id) {
        return interaction.reply({
          embeds: [
            errorEmbed("Vous n'avez pas la permission de modifier ce message."),
          ],
          ephemeral: true,
        });
      }

      switch (actionName) {
        case "panelArchiveModal":
          console.log("panelArchiveModal");
          if (!interaction.isModalSubmit()) return;
          await panelArchiveModal(interaction);
          break;
        case "panelArchivePermission":
          console.log("panelArchivePermission");
          if (!interaction.isButton()) return;
          await panelArchivePermission(interaction);
          break;
        case "panelArchiveClose":
          console.log("panelArchiveClose");
          if (!interaction.isButton()) return;
          await panelArchiveClose(interaction);
          break;
        case "panelArchiveReset":
          console.log("panelArchiveReset");
          if (!interaction.isButton()) return;
          await panelArchiveReset(interaction);
          break;
        case "panelArchiveUser":
          console.log("panelArchiveUser");
          if (!interaction.isChannelSelectMenu()) return;
          await panelArchiveUser(interaction);
          break;
        case "panelArchiveStaff":
          console.log("panelArchiveStaff");
          if (!interaction.isChannelSelectMenu()) return;
          await panelArchiveStaff(interaction);
          break;
      }
    }
  },
};
