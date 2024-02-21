import { node_env, clientId, guildId, token } from "../config.json";
import { RubbyLogger } from "./utils/logger";
import { REST, Routes } from "discord.js";
import fs from "node:fs";
import path from "node:path";

const logger = RubbyLogger({
  logName: "Rubby",
  level: "silly",
  directory: node_env === "production" ? "dist" : "src",
});

const commands = [];
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
    } else {
      logger.warn(
        `The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

const rest = new REST().setToken(token);

(async () => {
  try {
    logger.info(
      `Started refreshing ${commands.length} application (/) commands.`,
    );

    const data = (await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    )) as unknown as Array<unknown>;

    logger.info(
      `Successfully reloaded ${data.length} application (/) commands.`,
    );
  } catch (error) {
    logger.error(error);
  }
})();
