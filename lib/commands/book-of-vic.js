import { SlashCommandBuilder } from 'discord.js';

import { db } from '../db.js';
import { logger } from '../logger.js';

const maxLines = 50;
const topN = 10;

export const metadata = new SlashCommandBuilder()
  .setName('bookofvic')
  .setDescription('Rumours about the Book of Vic')
  .addSubcommand(subcommand =>
		subcommand
			.setName('add')
			.setDescription('Adds a rumour concerning the contents of the Book of Vic')
			.addStringOption(option => 
        option.setName('rumour')
          .setDescription('The rumour to add (it will be prefaced by "Some say the Book of Vic...")')
          .setRequired(true)
  ));

export async function handler(interaction) {
  const subcommand = interaction.options.getSubcommand();
  switch (subcommand) {
    case 'add':
      await add(interaction);
      break;
  }
}

async function add(interaction) {
  const nick = interaction.member.displayName;
  const rumour = interaction.options.getString('rumour');

  try {
    db.prepare('INSERT INTO book_of_vic (added_by, text) VALUES (?, ?)').run(nick, rumour);
    await interaction.reply({ content: 'The lore surrounding the _Book of Vic_ grows deeper...', ephemeral: true });
  } catch (err) {
    logger.error(err);
    await interaction.reply({ content: `Failed to add the rumour to the database :slight_frown:`, ephemeral: true });
  }
}
