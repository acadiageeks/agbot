import { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, hyperlink, codeBlock } from 'discord.js';

import { db } from '../db.js';
import { logger } from '../logger.js';

const quotesUrlPrefix = 'https://ag.mvgrafx.net/quotes/';

export const metadata = new SlashCommandBuilder()
  .setName('quote')
  .setDescription('Returns a random quote from the AG archives')

export async function handler(interaction) {
  const offset = await randomOffset();
  const { currentQuote, previousQuote } = await getQuotes(offset);
  const response = await buildResponse(currentQuote, previousQuote, offset);

  const reply = await interaction.reply(response);
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60_000
  });
  
  collector.on('collect', async (buttonInteraction) => {
    await processButtonInteraction(buttonInteraction);
  });
}

async function getQuotes(offset = 0) {
  let currentQuote = null;
  let previousQuote = null;

  try {
    const result = db.prepare('SELECT id, content FROM quotes ORDER BY id desc LIMIT 2 OFFSET ?').all(offset);
    if (result[0]) {
      currentQuote = result[0];
    }
    if (result[1]) {
      previousQuote = result[1];
    }
  } catch (err) {
    logger.error(err);
  }

  return { currentQuote, previousQuote };
}

async function randomOffset() {
  let tableSize = 0;

  try {
    const result = db.prepare('select count(*) from quotes').get();
    tableSize = result.count;
  } catch (err) {
    logger.error(err);
  }

  return Math.floor(Math.random() * tableSize);
}

async function buildResponse(currentQuote, previousQuote, offset = 0) {
  const quoteUrl = `${quotesUrlPrefix}${currentQuote.id}`;
  const content = `**Quote №${hyperlink(currentQuote.id, quoteUrl)}**\n${codeBlock(currentQuote.content)}`;

  const previousQuoteButton = new ButtonBuilder()
    .setCustomId(`previous-${offset}`)
    .setLabel('Previous')
    .setStyle(ButtonStyle.Secondary);

  const nextQuoteButton = new ButtonBuilder()
    .setCustomId(`next-${offset}`)
    .setLabel('Next')
    .setStyle(ButtonStyle.Secondary);

  const randomQuoteButton = new ButtonBuilder()
    .setCustomId('random')
    .setLabel('Random')
    .setStyle(ButtonStyle.Secondary);

  const postQuoteButton = new ButtonBuilder()
    .setCustomId('post')
    .setLabel('Post')
    .setStyle(ButtonStyle.Primary);

  let row = null;

  if (currentQuote && offset == 0) {
    row = new ActionRowBuilder()
			.addComponents(previousQuoteButton,randomQuoteButton, postQuoteButton);
  } else if (currentQuote && previousQuote) {
    row = new ActionRowBuilder()
			.addComponents(previousQuoteButton, nextQuoteButton, randomQuoteButton, postQuoteButton);
  } else {
    row = new ActionRowBuilder()
			.addComponents(nextQuoteButton, randomQuoteButton, postQuoteButton);
  }

  return {
    content: content,
    components: [row],
    ephemeral: true,
  };
}

async function parseCustomId(customId) {
  let [action, offset] = customId.split('-');
  offset = parseInt(offset);
  return { action, offset };
}

async function processButtonInteraction(interaction) {
  let currentQuote, previousQuote, newOffset;

  switch(interaction.customId) {
    case 'post':
      currentQuote = interaction.message.content;
      await interaction.deferUpdate();
      await interaction.message.channel.send(currentQuote);
      return;
    case 'random':
      newOffset = await randomOffset();
      break;
    default:
      const {action, offset} = await parseCustomId(interaction.customId);

      if (action === 'next') {
        newOffset = offset - 1;
      } else if (action === 'previous') {
        newOffset = offset + 1;
      }
  }

  ({ currentQuote, previousQuote } = await getQuotes(newOffset));
  const response = await buildResponse(currentQuote, previousQuote, newOffset);
  await interaction.update(response);
}
