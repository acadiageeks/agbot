import Database from 'better-sqlite3';

import { logger } from './logger.js';

class SQLite3 {

  constructor() {
      if (!SQLite3.instance) {
        SQLite3.instance = new Database(process.env.DATABASE_PATH, { verbose: logger.debug });
      }
  }

  sharedInstance() {
      return SQLite3.instance;
  }

}

export const db = new SQLite3().sharedInstance();
