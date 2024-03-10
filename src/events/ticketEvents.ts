import ticketSchema from "../models/ticket.schema";
import { errorEmbed } from "../utils/embed";
import { isStaff } from "../utils/user";
import {
  ticketAddUser,
  ticketClaim,
  ticketClose,
  ticketLock,
  ticketOpen,
} from "./ticket/actions";
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

    const [actionName, id] = interaction.customId.split("-");

    if (actionName.startsWith("ticket")) {
      await interaction.deferReply({ ephemeral: true });

      if (actionName === "ticketOpen") {
        console.log("ticketOpen");
        if (!interaction.isButton()) return;
        return await ticketOpen(interaction);
      }

      const canExecute = await isStaff(interaction);

      if (!canExecute)
        return await interaction.editReply({
          embeds: [
            errorEmbed(
              "Vous n'avez pas la permission d'effectuer cette action.",
            ),
          ],
        });

      const ticket = await ticketSchema.findOne({
        guild_id: interaction.guildId,
        _id: id,
      });

      if (!ticket)
        return await interaction.editReply({
          embeds: [errorEmbed("Ce ticket n'existe plus.")],
        });

      if (ticket.closed)
        return await interaction.editReply({
          embeds: [errorEmbed("Ce ticket est  en cours de fermeture.")],
        });

      switch (actionName) {
        case "ticketClose":
          console.log("ticketClose");
          if (!interaction.isButton()) return;
          await ticketClose(interaction, ticket);
          break;
        case "ticketLock":
          console.log("ticketLock");
          if (!interaction.isButton()) return;
          await ticketLock(interaction, ticket);
          break;
        case "ticketAddUser":
          console.log("ticketAddUser");
          if (!interaction.isUserSelectMenu() && !interaction.isButton())
            return;
          await ticketAddUser(interaction, ticket);
          break;
        case "ticketClaim":
          console.log("ticketClaim");
          if (!interaction.isButton()) return;
          await ticketClaim(interaction, ticket);
          break;
      }
    }
  },
};
