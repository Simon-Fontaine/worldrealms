import * as fs from "fs";
import * as path from "path";
import { node_env } from "../config.json";
import { RubbyLogger } from "./utils/logger";
import { Client } from "discord.js";

export interface Task {
  name: string;
  run(client: Client): Promise<void>;
  interval?: number;
}

export class TaskHandler {
  private tasks: Task[] = [];
  private intervalIds: NodeJS.Timeout[] = [];
  private logger = RubbyLogger({
    logName: "TaskHandler",
    level: "info",
    directory: node_env === "production" ? "dist" : "src",
  });

  constructor(
    taskDirectory: string,
    private client: Client,
  ) {
    this.loadTasks(taskDirectory, client);
  }

  private loadTasks(taskDirectory: string, client: Client) {
    const taskPath = path.join(__dirname, taskDirectory);
    const taskFiles = fs.readdirSync(taskPath);

    this.logger.info(`Found ${taskFiles.length} tasks`);

    taskFiles.forEach((file) => {
      try {
        const taskModule = require(path.join(taskPath, file));
        if (taskModule.default && typeof taskModule.default === "function") {
          const task: Task = new taskModule.default();
          this.tasks.push(task);
        } else {
          this.logger.warn(`Invalid task file: ${file}`);
        }
      } catch (error) {
        this.logger.error(`Error loading task: ${file}`, error);
      }
    });
  }

  public start() {
    this.tasks.forEach((task) => {
      if (task.interval) {
        const intervalId = setInterval(
          async () => await task.run(this.client),
          task.interval,
        );
        this.intervalIds.push(intervalId);
      } else {
        task.run(this.client);
      }
    });
  }

  public stop() {
    this.intervalIds.forEach((intervalId) => clearInterval(intervalId));
  }
}
