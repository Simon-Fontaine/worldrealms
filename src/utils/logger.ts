import winston from "winston";

const defaultFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`,
  ),
);

const RubbyLogger = ({
  logName,
  level,
  directory,
}: {
  logName: string;
  level: "silly" | "debug" | "verbose" | "info" | "warn" | "error";
  directory: string;
}): winston.Logger =>
  winston.createLogger({
    level,
    transports: [
      new winston.transports.Console({
        level,
        format: winston.format.combine(
          defaultFormat,
          winston.format.colorize({ all: true }),
        ),
      }),
      new winston.transports.File({
        filename: `./${directory}/logs/${logName}/${logName}-Error.log`,
        level: "error",
        format: defaultFormat,
      }),
      new winston.transports.File({
        filename: `./${directory}/logs/${logName}/${logName}-Warn.log`,
        level: "warn",
        format: defaultFormat,
      }),
      new winston.transports.File({
        filename: `./${directory}/logs/${logName}/${logName}-All.log`,
        level: "silly",
        format: defaultFormat,
      }),
      new winston.transports.File({
        filename: `./${directory}/logs/globalLog.log`,
        level: "silly",
        format: defaultFormat,
      }),
    ],
  });

export { RubbyLogger };
