import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const priorContext = 10;

export async function handler(bot, message) {
  await message.channel.sendTyping();

  let initialPrompt = `You are ${bot.user.username}, a helpful bot that lives in the Acadia Geeks Discord server. `;
  initialPrompt += 'You are here to help people with their questions. ' +
    'Feel free to be a little irreverent, but don\'t be a jerk. If anyone asks, Vic sucks.';

  let priorMessages = await message.channel.messages.fetch({ limit: priorContext })
  priorMessages = Array.from(priorMessages.values());

  let messages = [{role: 'system', content: initialPrompt}];
  for (var i = priorMessages.length - 1; i >= 0; i--) {
    const message = priorMessages[i];
    const role = message.author === bot.user ? 'assistant' : 'user';
    const name = message.author.username.replaceAll(/[^a-zA-Z0-9_-]/g, '-') ;
    const content = message.cleanContent;

    messages.push({role: role, content: content, name: name});
  }

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: messages,
  });

  const response = completion.data.choices[0];

  if (response) {
    await message.reply(response.message.content);
  } else {
    await message.reply('Sorry, I\'m not sure how to respond to that.');
  }
}
