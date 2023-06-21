import { SlashCommandBuilder } from 'discord.js';

import { pool } from '../db.js';

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

  const connection = await pool.connect();
  try {
    await connection.query('INSERT INTO bookofvic (added_by, added_on, book_text) VALUES ($1, $2, $3)', [nick, 'NOW()', rumour]);

    await interaction.reply({ content: 'The lore surrounding the _Book of Vic_ grows deeper...', ephemeral: true });
  } finally {
    connection.release();
  }
}
