import * as dotenv from 'dotenv';
import Bolt from '@slack/bolt';

import { logMessage } from './logger/log-message.js';
import { nlog } from './quotes/nlog.js'

dotenv.config();

const app = new Bolt.App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true
});

// log all messages to channels we're in
app.event('message', async ({ event, client, logger }) => {
  if (event.subtype !== undefined) { return; } // ignore edits, system messages, etc.
  await logMessage(event, client, logger);
});

app.command('/nlog', async ({ ack, body, client, respond, logger }) => {
  await ack();
  await nlog(body, client, respond, logger);
});

// start listening
(async () => {
  await app.start();
})();
