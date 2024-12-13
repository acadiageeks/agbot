import { OpenAI } from 'openai';

import * as pkg from '../../package.json' with { type: 'json' };
import { functionLibrary } from '../function-library.js';
import { logger } from '../logger.js';

const model = 'gpt-4o';

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const priorContext = 20;

const functions = await functionLibrary();

export async function handler(bot, message) {
  await message.channel.sendTyping();

  let initialPrompt = `You are ${bot.user.displayName}, a helpful Canadian bot that lives in the Acadia Geeks Discord server. `;
  initialPrompt += `Your current version number is ${pkg.default.version} and you are using the ${model} model. `;
  initialPrompt += 'You are here to help people with their questions and participate in interesting discussions. ' +
    'Try to be thoughtful, but concise. ' +
    'Please keep your responses to less than 1000 characters (including whitespace), which is the maximum supported by Discord. ' +
    'If anyone asks, Vic sucks.\n\n' +
    'For image generation purposes, here are some descriptions of the appearances of some channel members:\n\n' ;
    '  - @Vic: a balding, white, middle-aged tech guy with a goatee and glasses\n' +
    '  - @tom: a tall, lanky, pilot, clean-shaven with short brown hair\n' +
    '  - @Jon: a portly, bearded, bespectacled male IT professional who resembling a lumberjack\n' +
    '  - @Durl: a magical, time-traveling dragon princess\n' +
    '  - @Leeroy: a shaggy-haired hipster with a neatly-trimmed beard\n' +
    '  - @Sean: a balding, silver-haired man - tall, with a perpetually glowering visage\n' +
    '  - @Ross: a bald, bespectacled white guy with a close-cropped beard\n' +
    '  - @bignose: a middle-aged, generic-looking pothead\n';

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

  let tools = [];
  Object.values(functions).forEach((klass) => {
    tools.push({type: 'function', function: klass.metadata});
  });

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      tools: tools,
    });
  } catch (error) {
    logger.error(error);
    await message.reply("Sorry, there was an OpenAI API error while processing your request :slight_frown:");
    return;
  }

  const response = completion.choices[0];

  if (!response) { await message.reply('Sorry, I\'m not sure how to respond to that.'); return; }

  if (response.message.content) {
    await message.reply(response.message.content);
  } else if (response.message.tool_calls.length > 0) {
    messages.push(response.message);

    for (const toolCall of response.message.tool_calls) {
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      const klass = functions[functionName];
      if (!klass) { await message.reply('Sorry, I tried to call a function that doesn\'t exist.'); return; }
      
      const func = new klass(functionArgs);
      const functionResult = await func.call(bot, message);

      messages.push({
        tool_call_id: toolCall.id,
        role: "tool",
        name: functionName,
        content: JSON.stringify(functionResult),
      });
    }

    let subcompletion;
    try {
      subcompletion = await openai.chat.completions.create({
        model: model,
        messages: messages,
      });
    } catch (error) {
      logger.error(error);
      await message.reply("Sorry, there was an OpenAI API error while processing your request :slight_frown:");
      return;
    }

    const subresponse = subcompletion.choices[0];
    await message.reply(subresponse.message.content);
  }
  
}
