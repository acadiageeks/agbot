import Postgres from 'pg';
import convertNum from 'number-to-words';

const maxLines = 50;

const pg = new Postgres.native.Pool({
  user: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT
});

const errorMessages = [
  "Stop being a shithead and trying to break my code.",
  "Fuct'er, bud.",
  "NO, YOU FUCK.",
  "Eat a dick.",
  "Eat a dick-flavoured cock.",
  ":middle_finger:"
];

export async function nlog(event, client, respond, logger) {
  const channel = await client.conversations.info({channel: event.channel_id});
  const numberOfLines = parseInt(event.text);

  if (!event.text.match(/^\d+$/) || numberOfLines < 1) {
    await respond({
      "response_type": "ephemeral",
      "text": errorMessages[Math.floor(Math.random() * errorMessages.length)]
    });
    return;
  }

  if (numberOfLines > maxLines) {
    await respond({
      "response_type": "ephemeral",
      "text": `${maxLines} lines maximum. Vic's shitty server can't handle any more than that.`
    });
    return;
  }

  const pool = await pg.connect();
  try {
    const res = await pool.query('SELECT nick, msg FROM irc WHERE channel = $1 ORDER BY date DESC LIMIT $2', [channel.channel.name, numberOfLines]);
    const rows = res.rows;

    var quote = '';
    for (var i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      quote += `<${row.nick}> ${row.msg}`;
      if (i != 0) quote += '\n';
    }

    await pool.query('INSERT INTO quotes (content) VALUES ($1)', [quote]);

    var responseText = `Logged ${convertNum.toWords(numberOfLines)} `;
    responseText += numberOfLines == 1 ? 'line.' : 'lines.';
    responseText += '\n' + "```" + quote + "```";
    await client.chat.postMessage({
      channel: event.channel_id,
      text: responseText
    });
  } finally {
    pool.release();
  }
}
