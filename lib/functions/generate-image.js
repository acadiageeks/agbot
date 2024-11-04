import { OpenAI } from 'openai';
import async_get_file from 'async-get-file';

import { BaseFunction } from "../base-function.js";
import { logger } from '../logger.js';

const model = 'dall-e-3';
const tmpDirectory = '/tmp/';
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

export default class GenerateImage extends BaseFunction {
  static get description() {
    return "Generate an image based on the input text";
  }

  static get supportedArgs() {
    return {
      requestor: {
        type: "string",
        description: "The name of the user questing the function call",
      },
      prompt: {
        type: "string",
        description: "The text to generate the image from",
      },
    };
  }

  static get requiredArgs() {
    return ['requestor', 'prompt'];
  }

  async call(bot, originatingMessage) {
    await super.call(bot, originatingMessage);

    const response = await openai.images.generate({
      model: model,
      prompt: this.args.prompt,
      n: 1,
      size: "1024x1024",
    });

    if (response.data[0]?.url) {
      const url = response.data[0].url;
      const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      const filename = `${genRanHex(8)}.png`;
      const options = {
        directory: tmpDirectory,
        filename: filename,
      }

      try {
        await async_get_file(url, options);
      } catch (error) {
        logger.error(error);
        return { status: "failed" };
      }

      originatingMessage.reply({files: [`${tmpDirectory}${filename}`]});
      return { status: "created" };
    }
    
    return { status: "failed" };
  }
}
