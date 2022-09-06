import * as dotenv from 'dotenv';
import Bolt from '@slack/bolt';

import { logMessage } from './logger/log-message.js';

dotenv.config();

const app = new Bolt.App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true
});

app.event('message', async ({ event, client, logger }) => {
  if (event.subtype !== undefined) { return; } // ignore edits, system messages, etc.

  await logMessage(event, client, logger);
});

(async () => {
  await app.start();
})();
