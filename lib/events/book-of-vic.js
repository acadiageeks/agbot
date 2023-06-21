import { pool } from '../db.js';

export async function handler(bot, message) {
  const passage = await randomPassage();
  if (passage) {
    await message.channel.sendTyping();
    await message.reply(`Some say the _Book of Vic_ ${passage}`);
  }
}

async function randomPassage(interaction) {
  let passage = null;

  const connection = await pool.connect();
  try {
    const result = await connection.query('SELECT book_text FROM bookofvic ORDER BY RANDOM() LIMIT 1');
    passage = result.rows[0].book_text;
  } finally {
    connection.release();
  }

  return passage;
}
