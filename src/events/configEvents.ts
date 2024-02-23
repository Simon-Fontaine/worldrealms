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
          if (!interaction.isButton()) return;
          await welcomeMessageModal(interaction);
          break;
        case "welcomeMessageEdit":
          if (!interaction.isModalSubmit()) return;
          await welcomeMessageEdit(interaction);
          break;
        case "welcomeMessageUserPing":
          if (!interaction.isButton()) return;
          await welcomeMessageUserPing(interaction);
          break;
        case "welcomeMessageVariables":
          if (!interaction.isButton()) return;
          await welcomeMessageVariables(interaction);
          break;
        case "welcomeMessageClose":
          if (!interaction.isButton()) return;
          await welcomeMessageClose(interaction);
          break;
        case "welcomeMessageReset":
          if (!interaction.isButton()) return;
          await welcomeMessageReset(interaction);
          break;
        case "welcomeMessageChannelSelect":
          if (!interaction.isChannelSelectMenu()) return;
          await welcomeMessageChannelSelect(interaction);
          break;
        case "welcomeMessageRoleSelect":
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
          if (!interaction.isButton()) return;
          await leaveMessageModal(interaction);
          break;
        case "leaveMessageEdit":
          if (!interaction.isModalSubmit()) return;
          await leaveMessageEdit(interaction);
          break;
        case "leaveMessageVariables":
          if (!interaction.isButton()) return;
          await leaveMessageVariables(interaction);
          break;
        case "leaveMessageClose":
          if (!interaction.isButton()) return;
          await leaveMessageClose(interaction);
          break;
        case "leaveMessageReset":
          if (!interaction.isButton()) return;
          await leaveMessageReset(interaction);
          break;
        case "leaveMessageChannelSelect":
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
          if (!interaction.isModalSubmit()) return;
          await panelArchiveModal(interaction);
          break;
        case "panelArchivePermission":
          if (!interaction.isButton()) return;
          await panelArchivePermission(interaction);
          break;
        case "panelArchiveClose":
          if (!interaction.isButton()) return;
          await panelArchiveClose(interaction);
          break;
        case "panelArchiveReset":
          if (!interaction.isButton()) return;
          await panelArchiveReset(interaction);
          break;
        case "panelArchiveUser":
          if (!interaction.isChannelSelectMenu()) return;
          await panelArchiveUser(interaction);
          break;
        case "panelArchiveStaff":
          if (!interaction.isChannelSelectMenu()) return;
          await panelArchiveStaff(interaction);
          break;
      }
    }
  },
};
