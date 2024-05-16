import { bot } from './lib/bot.js';
import { pool } from './lib/db.js';
import { logger } from './lib/logger.js';

(async () => {
  logger.info(`Checking database connection...`);
  const connection = await pool.connect();
  try {
    const now = await connection.query('SELECT NOW()');
    logger.info(`Database connection established at ${now.rows[0].now}`);
  } finally {
    connection.release();
  }

  logger.info(`Initializing...`);
  await bot.initialize();

  logger.info(`Connecting...`);
  await bot.login(process.env.DISCORD_TOKEN);
})();
