import { OpenAI } from 'openai';

import * as pkg from '../../package.json' assert { type: 'json' };
//import { functionLibrary } from '../function-library.js';
import { logger } from '../logger.js';

const model = 'gpt-4o';

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const priorContext = 20;

//const functions = await functionLibrary();

export async function handler(bot, message) {
  await message.channel.sendTyping();

  let initialPrompt = `You are ${bot.user.displayName}, a helpful Canadian bot that lives in the Acadia Geeks Discord server. `;
  initialPrompt += `Your current version number is ${pkg.default.version} and you are using the ${model} model. `;
  initialPrompt += 'You are here to help people with their questions and participate in interesting discussions. ' +
    'Try to be thoughtful, but concise. ' +
    'Please keep your responses to less than 2000 characters (including whitespace), which is the maximum supported by Discord. ' +
    'If anyone asks, Vic sucks.';

  let priorMessages = await message.channel.messages.fetch({ limit: priorContext })
  priorMessages = Array.from(priorMessages.values());

  let messages = [{role: 'system', content: initialPrompt}];
  for (var i = priorMessages.length - 1; i >= 0; i--) {
    const message = priorMessages[i];
    const role = message.author === bot.user ? 'assistant' : 'user';
    const name = message.author.displayName.replaceAll(/[^a-zA-Z0-9_-]/g, '-') ;
    const content = message.cleanContent;

    messages.push({role: role, content: content, name: name});
  }

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      //functions: Object.values(functions).map((klass) => klass.metadata),
    });
  } catch (error) {
    logger.error(error);
    await message.reply({
      content: "Sorry, there was an OpenAI API error while processing your request :slight_frown:",
      ephemeral: true,
    });
    return;
  }

  const response = completion.choices[0];

  if (response) {
    await message.reply(response.message.content);
  } else {
    await message.reply('Sorry, I\'m not sure how to respond to that.');
  }
}
