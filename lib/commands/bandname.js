import { SlashCommandBuilder } from 'discord.js';

import { db } from '../db.js';
import { logger } from '../logger.js';

const maxLines = 50;

export const metadata = new SlashCommandBuilder()
  .setName('bandname')
  .setDescription('Interact with the band name database')
  .addSubcommand(subcommand =>
		subcommand
			.setName('add')
			.setDescription('Adds a band name to the database')
			.addStringOption(option => 
        option.setName('name')
          .setDescription('The name of the band')
          .setRequired(true)
  ))
  .addSubcommand(subcommand =>
		subcommand
			.setName('random')
			.setDescription('Returns a random band name'));

export async function handler(interaction) {
  const subcommand = interaction.options.getSubcommand();
  switch (subcommand) {
    case 'add':
      await add(interaction);
      break;
    case 'random':
      await random(interaction);
      break;
  }
}

async function add(interaction) {
  const nick = interaction.member.displayName;
  const name = interaction.options.getString('name');

  try {
    db.prepare('INSERT INTO bands (added_by, name) VALUES (?, ?)').run(nick, name);
    await interaction.reply(`Added **${name}** to the database!`);
  } catch (err) {
    logger.error(err);
    await interaction.reply(`Failed to add **${name}** to the database :slight_frown:`);
  }
}

async function random(interaction) {
  try {
    const row = db.prepare('SELECT name FROM bands ORDER BY RANDOM() LIMIT 1').get();
    const name = row.name;

    await interaction.reply(`**${name}**`);
  } catch (err) {
    logger.error(err);
    await interaction.reply(`Failed to retrieve a band name :slight_frown:`);
  }
}
