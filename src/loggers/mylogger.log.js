const { format, createLogger, transports } = require("winston");
require("winston-daily-rotate-file");

class MyLogger {
  constructor() {
    const formatPrintf = format.printf(
      ({ level, message, context, requestId, timestamp, metadata }) => {
        return `${timestamp}::${level}::${message}::${context}::${requestId}::${JSON.stringify(
          metadata
        )}|`;
      }
    );

    this.logger = createLogger({
      format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        formatPrintf
      ),
      transports: [
        // new transports.Console(),
        new transports.DailyRotateFile({
          dirname: "src/logs",
          level: "info",
          filename: "application-%DATE%.info.log",
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "14d",
          format: format.combine(
            format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            formatPrintf
          ),
        }),
        new transports.DailyRotateFile({
          dirname: "src/logs",
          level: "error",
          filename: "application-%DATE%.error.log",
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "14d",
          format: format.combine(
            format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            formatPrintf
          ),
        }),
        new transports.DailyRotateFile({
          dirname: "src/logs",
          level: "warn",
          filename: "application-%DATE%.warn.log",
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "14d",
          format: format.combine(
            format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            formatPrintf
          ),
        }),
      ],
    });
  }
  commonLog(params) {
    let context, req, metadata;
    if (!Array.isArray(params)) {
      context = params;
    } else {
      [context, req, metadata] = params;
    }
    const requestId = req || "unknow";

    return { requestId, context, metadata };
  }

  log(message, params) {
    const paramLog = this.commonLog(params);
    const logObject = Object.assign({ message }, paramLog);
    this.logger.info(logObject);
  }

  error(message, params) {
    const paramLog = this.commonLog(params);
    const logObject = Object.assign({ message }, paramLog);
    this.logger.error(logObject);
  }

  warning(message, params) {
    const paramLog = this.commonLog(params);
    const logObject = Object.assign({ message }, paramLog);
    this.logger.warn(logObject);
  }
}

module.exports = new MyLogger();
