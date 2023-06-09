import pino from "pino";

class Logger {

  constructor() {
      if (!Logger.instance) {
        Logger.instance = pino();
      }
  }

  sharedInstance() {
      return Logger.instance;
  }

}

export const logger = new Logger().sharedInstance();
