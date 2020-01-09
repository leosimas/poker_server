import winston from "winston";

const { combine, timestamp, printf,colorize } = winston.format;

const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

export const MeuLogger = winston.createLogger({
    format: combine(
        colorize(),
        timestamp(),
        myFormat
    ),
    transports: [
        new winston.transports.Console({ level: 'debug' }),
        new winston.transports.File({ filename: "logs/teste.log" })
    ]
});
