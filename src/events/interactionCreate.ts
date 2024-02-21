import { Collection, Events, Interaction } from "discord.js";

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        interaction.client.logger.error(
          `Aucune commande correspondant à ${interaction.commandName} n'a été trouvée.`,
        );
        return;
      }

      const { cooldowns } = interaction.client;
      if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Collection());
      }

      const now = Date.now();
      const timestamps = cooldowns.get(command.data.name);
      const defaultCooldownDuration = 3;
      const cooldownAmount =
        (command.cooldown ?? defaultCooldownDuration) * 1000;

      if (timestamps.has(interaction.user.id)) {
        const expirationTime =
          timestamps.get(interaction.user.id) + cooldownAmount;

        if (now < expirationTime) {
          const expiredTimestamp = Math.round(expirationTime / 1000);
          return interaction.reply({
            content: `Veuillez patienter, vous êtes en cooldown pour \`${command.data.name}\`. Vous pouvez l'utiliser à nouveau <t:${expiredTimestamp}:R>.`,
            ephemeral: true,
          });
        }
      }

      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content:
              "Une erreur s'est produite lors de l'exécution de cette commande !",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content:
              "Une erreur s'est produite lors de l'exécution de cette commande !",
            ephemeral: true,
          });
        }
      }
    } else if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        interaction.client.logger.error(
          `Aucune commande correspondant à ${interaction.commandName} n'a été trouvée.`,
        );
        return;
      }

      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error(error);
      }
    }
  },
};
