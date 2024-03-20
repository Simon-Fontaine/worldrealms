import { mongoURI, node_env, token } from "../config.json";
import { TaskHandler } from "./taskHandler";
import { RubbyLogger } from "./utils/logger";
import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import fs from "fs/promises";
import mongoose from "mongoose";
import path from "path";

(async () => {
  try {
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
      partials: [Partials.Channel, Partials.GuildMember, Partials.User],
    });

    client.logger = RubbyLogger({
      logName: "Client",
      level: node_env === "production" ? "info" : "debug",
      directory: node_env === "production" ? "dist" : "src",
    });

    client.logger.info("Starting bot initialization...");

    client.commands = new Collection();
    client.events = new Collection();
    client.cooldowns = new Collection();

    await initCommands(client);
    client.logger.info(`Loaded ${client.commands.size} commands`);
    await initEvents(client);
    client.logger.info(`Loaded ${client.events.size} events`);

    const taskHandler = new TaskHandler("./tasks", client);
    taskHandler.start();

    await mongoose.connect(mongoURI);
    client.logger.info("Connected to MongoDB");
    client.logger.info("Bot initialization completed.");

    await client.login(token);
  } catch (error) {
    console.error("An error occurred:", error);
  }
})();

async function initCommands(client: Client) {
  const commandsPath = path.join(__dirname, "commands");
  const commandFolders = await fs.readdir(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = await fs.readdir(folderPath);

    for (const file of commandFiles) {
      if (file.endsWith(".js")) {
        const command = require(path.join(folderPath, file));
        if ("data" in command && "execute" in command) {
          client.commands.set(command.data.name, command);
        } else {
          client.logger.warn(
            `The command at ${path.join(folderPath, file)} is missing a required "data" or "execute" property.`,
          );
        }
      }
    }
  }
}

async function initEvents(client: Client) {
  const eventsPath = path.join(__dirname, "events");
  const eventFiles = await fs.readdir(eventsPath);

  for (const file of eventFiles) {
    if (file.endsWith(".js")) {
      const event = require(path.join(eventsPath, file));
      if (event.once) {
        client.once(event.name, (...args: any[]) => event.execute(...args));
      } else {
        client.on(event.name, (...args: any[]) => event.execute(...args));
      }
      client.events.set(event.name, event);
    }
  }
}
