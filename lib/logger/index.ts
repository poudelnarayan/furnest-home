import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: { colorize: true, singleLine: true },
        },
  redact: {
    paths: ["req.headers.authorization", "password", "cardData", "token"],
    remove: true,
  },
});
