import { db } from '../db.js';

export async function handler(bot, message) {
  const passage = await randomPassage();
  if (passage) {
    await message.channel.sendTyping();
    await message.reply(`Some say the _Book of Vic_ ${passage}`);
  }
}

async function randomPassage(interaction) {
  let passage = null;

  try {
    const row = db.prepare('SELECT text FROM book_of_vic ORDER BY RANDOM() LIMIT 1').get();
    passage = row.text;
  } catch (err) {
    console.error(err);
  }

  return passage;
}
