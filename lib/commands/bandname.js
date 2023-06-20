import { SlashCommandBuilder } from 'discord.js';

import { pool } from '../db.js';

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

  const connection = await pool.connect();
  try {
    await connection.query('INSERT INTO bandname (nick, date, name) VALUES ($1, $2, $3)', [nick, 'NOW()', name]);

    await interaction.reply(`Added **${name}** to the database!`);
  } finally {
    connection.release();
  }
}

async function random(interaction) {
  const connection = await pool.connect();
  try {
    const result = await connection.query('SELECT name FROM bandname ORDER BY RANDOM() LIMIT 1');
    const name = result.rows[0].name;

    await interaction.reply(`**${name}**`);
  } finally {
    connection.release();
  }
}
