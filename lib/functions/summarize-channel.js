import { OpenAI } from 'openai';
import { isToday } from "date-fns";

import { BaseFunction } from "../base-function.js";
import { logger } from '../logger.js';

const model = 'gpt-4o';
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

export default class GetMajorOrder extends BaseFunction {
  static get description() {
    return "Summarize activity in the current channel for the given time period";
  }

  static get supportedArgs() {
    return {
      timePeriod: {
        type: "string",
        description: "The period of time to summarize activity for, e.g. 'today', 'yesterday', 'this week', 'last week', 'this month', 'last month'. Defaults to 'today'.",
      },
    };
  }

  async call(bot, originatingMessage) {
    await super.call(bot, originatingMessage);

    const channel = originatingMessage.channel;
    const timePeriod = this.args.timePeriod || 'today';
    let messageHistory = [];

    let messagePointer = originatingMessage;

    while (messagePointer) {
      await channel.messages.fetch({ limit: 100, before: messagePointer.id }).then(messagePage => {
        let boundsMet = false;
        messagePage.forEach((message) => {
          const messageTimestamp = new Date(message.createdTimestamp);
          if (isToday(messageTimestamp)) {
            const role = message.author === bot.user ? 'assistant' : 'user';
            const name = message.author.displayName.replaceAll(/[^a-zA-Z0-9_-]/g, '-') ;
            const content = message.cleanContent;

            messageHistory.push({role: role, content: content, name: name});
          } else {
            boundsMet = true;
          }
        });

        // Update message pointer to be the last message on the page of messages
        if (!boundsMet && messagePage.size > 0) {
          messagePointer = messagePage.at(messagePage.size - 1);
        } else {
          messagePointer = null;
        }
      });
    }

    let prompt = `The following messages are a summary of the activity in the Acadia Geeks Discord server's "${originatingMessage.channel.name}" channel for ${timePeriod}. `;
    prompt += `Please summarize the activity in the channel in 1000 characters or less.`;

    messageHistory.push({role: 'system', content: prompt});
    messageHistory = messageHistory.reverse();

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: model,
        messages: messageHistory,
      });
    } catch (error) {
      logger.error(error);
      return { error: "Sorry, there was an OpenAI API error while processing your request :slight_frown:" };
    }

    const response = completion.choices[0];
    logger.info(response.message.content);

    return { summary: response.message.content };
  }
}
