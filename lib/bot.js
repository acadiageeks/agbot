import bolt from "@slack/bolt"
import pino from "pino"

import { nlog } from "./commands.js"
import { logMessage } from "./events.js"

const { App } = bolt
const logger = pino()

const logWrapper = {
  debug: (...msgs) => { msgs.forEach((msg) => { logger.debug(msg) }) },
  info: (...msgs) => { msgs.forEach((msg) => { logger.info(msg) }) },
  warn: (...msgs) => { msgs.forEach((msg) => { logger.warn(msg) }) },
  error: (...msgs) => { msgs.forEach((msg) => { logger.error(msg) }) },
  setLevel: (level) => { logger.level = level },
  getLevel: () => { return logger.level },
  setName: (_) => { /* no op */ },
}

export const bot = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
  logger: logWrapper,
  port: process.env.PORT || 9000,
})

// log all messages to channels we're in
bot.event('message', async ({ event, client, logger }) => {
  if (event.subtype !== undefined) { return; } // ignore edits, system messages, etc.
  await logMessage(event, client, logger);
});

bot.command('/nlog', async ({ ack, body, client, respond, logger }) => {
  await ack();
  await nlog(body, client, respond, logger);
});
