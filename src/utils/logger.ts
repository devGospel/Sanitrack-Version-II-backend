import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const level = () => {
  const env = process.env.NODE_ENV || "staging";
  const isStaging = env === "staging";
  return isStaging ? "debug" : "info";
};

const format = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.label} ${info.level} : ${info.message}`
  )
);
let transports;
if (process.env.NODE_ENV === "development") {
  console.log("hello")
  transports = [new winston.transports.Console()];
} else if (process.env.NODE_ENV === "staging") {
  transports = [
    new winston.transports.File({
      filename: "audit-stage.log",
      level: "info",
    }),
  ];
} else if(process.env.NODE_ENV === "testing"){ 
  transports = [
    new winston.transports.Console()
  ]
} else {
  transports = [
    // new winston.transports.File({ filename: "audit.log", level: "info" }),
    new winston.transports.Console()
  ];
}

const Logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export { Logger };
