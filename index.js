import * as dotenv from 'dotenv'
import Bolt from '@slack/bolt'

dotenv.config()

const app = new Bolt.App({
  token: process.env.BOT_TOKEN,
  appToken: process.env.APP_TOKEN,
  socketMode: true
})

;(async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
})()
