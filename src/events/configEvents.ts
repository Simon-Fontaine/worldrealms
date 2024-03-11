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
          interaction.client.logger.debug("welcomeMessageModal");
          if (!interaction.isButton()) return;
          await welcomeMessageModal(interaction);
          break;
        case "welcomeMessageEdit":
          interaction.client.logger.debug("welcomeMessageEdit");
          if (!interaction.isModalSubmit()) return;
          await welcomeMessageEdit(interaction);
          break;
        case "welcomeMessageUserPing":
          interaction.client.logger.debug("welcomeMessageUserPing");
          if (!interaction.isButton()) return;
          await welcomeMessageUserPing(interaction);
          break;
        case "welcomeMessageVariables":
          interaction.client.logger.debug("welcomeMessageVariables");
          if (!interaction.isButton()) return;
          await welcomeMessageVariables(interaction);
          break;
        case "welcomeMessageClose":
          interaction.client.logger.debug("welcomeMessageClose");
          if (!interaction.isButton()) return;
          await welcomeMessageClose(interaction);
          break;
        case "welcomeMessageReset":
          interaction.client.logger.debug("welcomeMessageReset");
          if (!interaction.isButton()) return;
          await welcomeMessageReset(interaction);
          break;
        case "welcomeMessageChannelSelect":
          interaction.client.logger.debug("welcomeMessageChannelSelect");
          if (!interaction.isChannelSelectMenu()) return;
          await welcomeMessageChannelSelect(interaction);
          break;
        case "welcomeMessageRoleSelect":
          interaction.client.logger.debug("welcomeMessageRoleSelect");
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
          interaction.client.logger.debug("leaveMessageModal");
          if (!interaction.isButton()) return;
          await leaveMessageModal(interaction);
          break;
        case "leaveMessageEdit":
          interaction.client.logger.debug("leaveMessageEdit");
          if (!interaction.isModalSubmit()) return;
          await leaveMessageEdit(interaction);
          break;
        case "leaveMessageVariables":
          interaction.client.logger.debug("leaveMessageVariables");
          if (!interaction.isButton()) return;
          await leaveMessageVariables(interaction);
          break;
        case "leaveMessageClose":
          interaction.client.logger.debug("leaveMessageClose");
          if (!interaction.isButton()) return;
          await leaveMessageClose(interaction);
          break;
        case "leaveMessageReset":
          interaction.client.logger.debug("leaveMessageReset");
          if (!interaction.isButton()) return;
          await leaveMessageReset(interaction);
          break;
        case "leaveMessageChannelSelect":
          interaction.client.logger.debug("leaveMessageChannelSelect");
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
          interaction.client.logger.debug("panelArchiveModal");
          if (!interaction.isModalSubmit()) return;
          await panelArchiveModal(interaction);
          break;
        case "panelArchivePermission":
          interaction.client.logger.debug("panelArchivePermission");
          if (!interaction.isButton()) return;
          await panelArchivePermission(interaction);
          break;
        case "panelArchiveClose":
          interaction.client.logger.debug("panelArchiveClose");
          if (!interaction.isButton()) return;
          await panelArchiveClose(interaction);
          break;
        case "panelArchiveReset":
          interaction.client.logger.debug("panelArchiveReset");
          if (!interaction.isButton()) return;
          await panelArchiveReset(interaction);
          break;
        case "panelArchiveUser":
          interaction.client.logger.debug("panelArchiveUser");
          if (!interaction.isChannelSelectMenu()) return;
          await panelArchiveUser(interaction);
          break;
        case "panelArchiveStaff":
          interaction.client.logger.debug("panelArchiveStaff");
          if (!interaction.isChannelSelectMenu()) return;
          await panelArchiveStaff(interaction);
          break;
      }
    }
  },
};
