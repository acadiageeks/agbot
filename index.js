import pino from "pino";

import { bot } from "./lib/bot.js";
import * as pkg from './package.json' assert { type: 'json' };

const logger = pino();

(async () => {
  await bot.start();
  logger.info(`agbot v${pkg.default.version} is up and running!`);
})();
