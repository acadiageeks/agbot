import { OpenAI } from 'openai';

import { BaseFunction } from "../base-function.js";
import { logger } from '../logger.js';

const model = 'dall-e-3';
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
    
    return response.data[0].url;
  }
}
