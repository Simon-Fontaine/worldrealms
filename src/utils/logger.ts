import winston from 'winston';

const config = {
	levels: {
		error: 0,
		debug: 1,
		warn: 2,
		data: 3,
		info: 4,
		verbose: 5,
		silly: 6,
	},
	colors: {
		error: 'red',
		debug: 'blue',
		warn: 'yellow',
		data: 'magenta',
		info: 'green',
		verbose: 'cyan',
		silly: 'grey',
	},
};

winston.addColors(config.colors);

const RubbyLogger = (input: {
	logName: string;
	level: string;
	directory: string;
}): winston.Logger =>
	winston.createLogger({
		levels: config.levels,
		level: `${input.level}`,
		transports: [
			new winston.transports.Console({
				level: `${input.level}`,

				format: winston.format.combine(
					winston.format.printf(
						(info) =>
							`${new Date().toLocaleDateString('fr-FR', {
								year: 'numeric',
								month: '2-digit',
								day: '2-digit',
								hour: '2-digit',
								minute: '2-digit',
								second: '2-digit',
							})} ${info.level.toLocaleUpperCase()}: ${info.message}`
					),
					winston.format.colorize({ all: true })
				),
			}),
			new winston.transports.File({
				filename: `./${input.directory}/logs/${input.logName}/${input.logName}-Error.log`,
				level: 'error',
				format: winston.format.printf(
					(info) =>
						`${new Date().toLocaleDateString('fr-FR', {
							year: 'numeric',
							month: '2-digit',
							day: '2-digit',
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit',
						})} ${info.level.toLocaleUpperCase()}: ${info.message}`
				),
			}),
			new winston.transports.File({
				filename: `./${input.directory}/logs/${input.logName}/${input.logName}-Warn.log`,
				level: 'warn',
				format: winston.format.printf(
					(info) =>
						`${new Date().toLocaleDateString('fr-FR', {
							year: 'numeric',
							month: '2-digit',
							day: '2-digit',
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit',
						})} ${info.level.toLocaleUpperCase()}: ${info.message}`
				),
			}),
			new winston.transports.File({
				filename: `./${input.directory}/logs/${input.logName}/${input.logName}-All.log`,
				level: 'silly',
				format: winston.format.printf(
					(info) =>
						`${new Date().toLocaleDateString('fr-FR', {
							year: 'numeric',
							month: '2-digit',
							day: '2-digit',
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit',
						})} ${info.level.toLocaleUpperCase()}: ${info.message}`
				),
			}),

			new winston.transports.File({
				format: winston.format.printf(
					(info) =>
						`${new Date().toLocaleDateString('fr-FR', {
							year: 'numeric',
							month: '2-digit',
							day: '2-digit',
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit',
						})} ${info.level.toLocaleUpperCase()}: ${info.message}`
				),
				filename: `./${input.directory}/logs/globalLog.log`,
				level: 'silly',
			}),
		],
	});

export { RubbyLogger };
