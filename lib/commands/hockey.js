import { SlashCommandBuilder } from 'discord.js';

import { db } from '../db.js';
import { logger } from '../logger.js';

const maxLines = 50;

export const metadata = new SlashCommandBuilder()
  .setName('hockey')
  .setDescription('Interact with the hockey team database')
  .addSubcommand(subcommand =>
		subcommand
			.setName('add')
			.setDescription('Adds a hockey team to the database')
			.addStringOption(option => 
        option.setName('name')
          .setDescription('The name of the team')
          .setRequired(true)
  ))
  .addSubcommand(subcommand =>
		subcommand
			.setName('random')
			.setDescription('Returns a random hockey team'));

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
  const name = interaction.options.getString('name')?.replace(/^the\s/i, '');

  try {
    db.prepare('INSERT INTO hockey_teams (added_by, name) VALUES (?, ?)').run(nick, name);
    await interaction.reply(`Added the **${name}** to the database!`);
  } catch (err) {
    logger.error(err);
    await interaction.reply(`Failed to add the **${name}** to the database :slight_frown:`);
  }
}

async function random(interaction) {
  try {
    const rows = db.prepare('SELECT name FROM hockey_teams ORDER BY RANDOM() LIMIT 2').all();
    const names = rows.map(row => row.name);

    await interaction.reply(`Tonight's match-up: the **${names[0]}** vs. the **${names[1]}**!`);
  } catch (err) {
    logger.error(err);
    await interaction.reply(`Failed to retrieve a band name :slight_frown:`);
  }
}
