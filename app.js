import Database from 'better-sqlite3';

import { bot } from './lib/bot.js';
import { logger } from './lib/logger.js';
import { db } from './lib/db.js';

(async () => {
  logger.info(`Checking database connection...`);
  try {
    db.pragma('journal_mode = WAL');
    const row = db.prepare(`SELECT DATETIME('now') AS now`).get();
    logger.info(`Database connection established at ${row.now}`);

    process.on('exit', (code) => {
      db.close();
      if (code === 0) {
        logger.info(`Process exited cleanly`);
      } else if (code === 130) {
        logger.warn(`Process was interrupted with code ${code}`);
      } else {
        logger.fatal(`Process exited with code ${code}`);
      }
    });
    process.on('SIGHUP', () => process.exit(128 + 1));
    process.on('SIGINT', () => process.exit(128 + 2));
    process.on('SIGTERM', () => process.exit(128 + 15));
  } catch (err) {
    logger.error(`Database connection failed: ${err}`);
    process.exit(1);
  }

  logger.info(`Initializing...`);
  await bot.initialize();

  logger.info(`Connecting...`);
  await bot.login(process.env.DISCORD_TOKEN);
})();
