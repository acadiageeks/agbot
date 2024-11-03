import pino from "pino";

class Logger {

  constructor() {
      if (!Logger.instance) {
        Logger.instance = pino({
          level: (process.env.LOG_LEVEL || 'info'),
        });
      }
  }

  sharedInstance() {
      return Logger.instance;
  }

}

export const logger = new Logger().sharedInstance();
