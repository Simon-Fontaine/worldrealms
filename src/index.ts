import { mongoURI, node_env, token } from "../config.json";
import { RubbyLogger } from "./utils/logger";
import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.User],
});

client.commands = new Collection();
client.cooldowns = new Collection();
client.logger = RubbyLogger({
  logName: "Rubby",
  level: "silly",
  directory: node_env === "production" ? "dist" : "src",
});

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
      client.commands.set(command.data.name, command);
    } else {
      client.logger.warn(
        `The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

(async () => {
  try {
    await mongoose.connect(mongoURI);
    client.logger.info("Connected to MongoDB");
  } catch (error) {
    client.logger.error(error);
  }
})();

client.login(token);
