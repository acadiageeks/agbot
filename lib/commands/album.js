import { SlashCommandBuilder } from 'discord.js';

import { pool } from '../db.js';

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

  const connection = await pool.connect();
  try {
    await connection.query('INSERT INTO album (nick, date, name) VALUES ($1, $2, $3)', [nick, 'NOW()', name]);

    await interaction.reply(`Added _${name}_ to the database!`);
  } finally {
    connection.release();
  }
}

async function random(interaction) {
  const connection = await pool.connect();
  try {
    const albumResult = await connection.query('SELECT name FROM album ORDER BY RANDOM() LIMIT 1');
    const albumName = albumResult.rows[0].name;

    const bandNameResult = await connection.query('SELECT name FROM bandname ORDER BY RANDOM() LIMIT 1');
    const bandName = bandNameResult.rows[0].name;

    await interaction.reply(`How about _${albumName}_ by **${bandName}**?`);
  } finally {
    connection.release();
  }
}

async function topten(interaction) {
  const connection = await pool.connect();
  try {
    const albumResults = await connection.query('SELECT name FROM album ORDER BY RANDOM() LIMIT $1', [topN]);
    const albumNames = albumResults.rows.map(row => row.name);

    const bandNameResults = await connection.query('SELECT name FROM bandname ORDER BY RANDOM() LIMIT $1', [topN]);
    const bandNames = bandNameResults.rows.map(row => row.name);

    let replyString = 'The AG Radio Top Ten albums of the moment are:';
    for (let i = 0; i < topN; i++) {
      replyString += `\n${i+1}. _${albumNames[i]}_ by **${bandNames[i]}**`;
    }

    await interaction.reply(replyString);
  } finally {
    connection.release();
  }
}
