import { OpenAI } from 'openai';

import * as pkg from '../../package.json' with { type: 'json' };
import { functionLibrary } from '../function-library.js';
import { logger } from '../logger.js';

const model = 'o3';
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
const priorContext = 20;
const functions = await functionLibrary();

export async function handler(bot, message) {
  // Send initial typing indicator
  await message.channel.sendTyping();

  // Start a background interval to keep sending typing every 5 seconds
  let typingIntervalActive = true;
  const typingInterval = setInterval(() => {
    if (typingIntervalActive) {
      message.channel.sendTyping().catch(() => {}); // ignore errors
    }
  }, 5000);

  // Ensure the interval is cleared when the handler finishes (success or error)
  try {
    await handleMentions(bot, message);
  } finally {
    typingIntervalActive = false;
    clearInterval(typingInterval);
  }
}

async function handleMentions(bot, message) {
  let initialPrompt = `You are ${bot.user.displayName}, a helpful Canadian bot that lives in the Acadia Geeks Discord server. `;
  initialPrompt += `Your current package version number is ${pkg.default.version} and you are using the OpenAI ${model} model. `;
  initialPrompt += 'You are here to help people with their questions and participate in interesting discussions. ' +
    'Try to be thoughtful, but concise. ' +
    'Keep your responses to less than 1000 characters (including whitespace), which is the maximum supported by Discord. ' +
    `The last ${priorContext} messages in this channel have been provided for your context, with the sender's name preceding the message. ` +
    `When you answer, do not include \'${bot.user.displayName}: \' before your response. ` +
    'If anyone asks, Vic sucks.\n\n';
  
  const userLocation = {
    type: "approximate",
    country: "CA",
    city: "Halifax",
    region: "Nova Scotia"
  };

  let priorMessages = await message.channel.messages.fetch({ limit: priorContext })
  priorMessages = Array.from(priorMessages.values());

  let inputItems = [];
  for (var i = priorMessages.length - 1; i >= 0; i--) {
    const message = priorMessages[i];
    const role = message.author === bot.user ? 'assistant' : 'user';
    const name = message.author.displayName.replaceAll(/[^a-zA-Z0-9_-]/g, '-') ;
    const content = message.cleanContent;

    inputItems.push({
      role: role,
      content: `${name}: ${content}`,
      type: 'message',
    });
  }

  let tools = [{
    type: "web_search_preview",
    user_location: userLocation,
  }];
  Object.values(functions).forEach((klass) => {
    tools.push({
      type: 'function',
      name: klass.metadata.name,
      description: klass.metadata.description,
      parameters: klass.metadata.parameters,
      user_location: userLocation,
    });
  });

  let response;
  try {
    response = await openai.responses.create({
      model: model,
      instructions: initialPrompt,
      input: inputItems,
      tools: tools,
      reasoning: {
        effort: "low",
        summary: "auto",
      },
    });
  } catch (error) {
    logger.error(error);
    await message.reply("Sorry, there was an OpenAI API error while processing your request :slight_frown:");
    return;
  }

  if (!response) { await message.reply('Sorry, I\'m not sure how to respond to that.'); return; }

  const output = response.output;

  if (response.output_text) {
    await message.reply(response.output_text);
  } else if (output.length > 0) {
    for (const outputItem of output) {
      inputItems.push(outputItem);

      if (outputItem.type != 'function_call') { continue; }
      
      const functionName = outputItem.name;
      const functionArgs = JSON.parse(outputItem.arguments);

      const klass = functions[functionName];
      if (!klass) { await message.reply('Sorry, I tried to call a function that doesn\'t exist.'); return; }
      
      const func = new klass(functionArgs);
      const functionResult = await func.call(bot, message);

      inputItems.push({
        type: "function_call_output",
        call_id: outputItem.call_id,
        output: JSON.stringify(functionResult),
      });

      if (functionName === 'GenerateImage') {
        return;
      }
  
      let subresponse;
      try {
        subresponse = await openai.responses.create({
          model: model,
          input: inputItems,
          tools: tools,
          store: true,
        });
      } catch (error) {
        logger.error(error);
        await message.reply("Sorry, there was an OpenAI API error while processing your request :slight_frown:");
        return;
      }
  
      await message.reply(subresponse.output_text);
    }
  }
}
