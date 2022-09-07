import Postgres from 'pg'
import * as dotenv from 'dotenv';

dotenv.config();

const pg = new Postgres.native.Pool({
  user: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT
});

export async function logMessage(event, client, logger) {
  const user = await client.users.profile.get({user: event.user});
  const channel = await client.conversations.info({channel: event.channel});
  
  const userName = user.profile.display_name;
  const channelName = channel.channel.name;
  const message = event.text;
  const timestamp = event.ts;

  const timestampMatches = timestamp.match(/(\d+)\.(\d{3})/);
  const timestampInMs = parseInt(`${timestampMatches[1]}${timestampMatches[2]}`);
  const timestampIso8601 = new Date(timestampInMs).toISOString();

  await pg.query('INSERT INTO irc (date, channel, nick, msg) VALUES ($1, $2, $3, $4)', [
    timestampIso8601,
    channelName,
    userName,
    message
  ]);

  logger.info({
    loggedMessage: {
      message: message,
      userName: userName,
      channelName: channelName,
      timestamp: timestampIso8601
    }
  });
}
