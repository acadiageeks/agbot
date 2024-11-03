import { SlashCommandBuilder, codeBlock } from 'discord.js';
import convertNum from 'number-to-words';

import { db } from '../db.js';
import { logger } from '../logger.js';

const maxLines = 50;

export const metadata = new SlashCommandBuilder()
  .setName('nlog')
  .setDescription('Logs the last n lines of dialogue in the current channel as a quote')
  .addIntegerOption(option => 
		option.setName('n')
			.setDescription('The number of lines to record')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(maxLines)
  );

export async function handler(interaction) {
  const n = interaction.options.getInteger('n');

  let messages = await interaction.channel.messages.fetch({ limit: n })
  messages = Array.from(messages.values());

  let quote = '';
  for (var i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const author = message.author.displayName;
    const content = message.cleanContent.replaceAll('`', '');

    quote += `<${author}> ${content}`;
    if (i != 0) quote += '\n';
  }

  try {
    db.prepare('INSERT INTO quotes (content) VALUES (?)').run(quote);

    var responseText = `Logged ${convertNum.toWords(messages.length)} `;
    responseText += n == 1 ? 'line:' : 'lines:';
    responseText += '\n' + codeBlock(quote);

    await interaction.reply(responseText);
  } catch (err) {
    logger.info(err);
    await interaction.reply(`Failed to add quote to the database :slight_frown:`);
  }
}
