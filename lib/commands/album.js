import { SlashCommandBuilder } from 'discord.js';

import { db } from '../db.js';
import { logger } from '../logger.js';

const maxLines = 50;
const topN = 10;

export const metadata = new SlashCommandBuilder()
  .setName('album')
  .setDescription('Interact with the album database')
  .addSubcommand(subcommand =>
		subcommand
			.setName('add')
			.setDescription('Adds an album name to the database')
			.addStringOption(option => 
        option.setName('name')
          .setDescription('The name of the album')
          .setRequired(true)
  ))
  .addSubcommand(subcommand =>
		subcommand
			.setName('random')
			.setDescription('Returns a random album'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('topten')
        .setDescription('Produces a list of top ten hits'));

export async function handler(interaction) {
  const subcommand = interaction.options.getSubcommand();
  switch (subcommand) {
    case 'add':
      await add(interaction);
      break;
    case 'random':
      await random(interaction);
      break;
    case 'topten':
      await topten(interaction);
      break;
  }
}

async function add(interaction) {
  const nick = interaction.member.displayName;
  const name = interaction.options.getString('name');

  try {
    db.prepare('INSERT INTO albums (added_by, name) VALUES (?, ?)').run(nick, name);
    await interaction.reply(`Added _${name}_ to the database!`);
  } catch (err) {
    logger.error(err);
    await interaction.reply(`Failed to add _${name}_ to the database :slight_frown:`);
  }
}

async function random(interaction) {
  try {
    const albumResult = db.prepare('SELECT name FROM albums ORDER BY RANDOM() LIMIT 1').get();
    const albumName = albumResult.name;

    const bandResult = db.prepare('SELECT name FROM bands ORDER BY RANDOM() LIMIT 1').get();
    const bandName = bandResult.name;

    await interaction.reply(`How about _${albumName}_ by **${bandName}**?`);
  } catch (err) {
    logger.error(err);
    await interaction.reply('Sorry, I couldn\'t find a random album :slight_frown:');
  }
}

async function topten(interaction) {
  try {
    const albumResults = db.prepare('SELECT name FROM albums ORDER BY RANDOM() LIMIT ?').all(topN);
    const albumNames = albumResults.map(row => row.name);

    const bandNameResults = db.prepare('SELECT name FROM bands ORDER BY RANDOM() LIMIT ?').all(topN);
    const bandNames = bandNameResults.map(row => row.name);

    let replyString = 'The AG Radio Top Ten albums of the moment are:';
    for (let i = 0; i < topN; i++) {
      replyString += `\n${i+1}. _${albumNames[i]}_ by **${bandNames[i]}**`;
    }

    await interaction.reply(replyString);
  } catch (err) {
    logger.error(err);
    await interaction.reply('Sorry, I couldn\'t find the top ten albums :slight_frown:');
  }
}
