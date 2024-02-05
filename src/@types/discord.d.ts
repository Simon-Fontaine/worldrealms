import { Collection } from 'discord.js';
import { Logger } from 'winston';

declare module 'discord.js' {
	export interface Client {
		commands: Collection<any, any>;
		cooldowns: Collection<any, any>;
		logger: Logger;
	}
}
