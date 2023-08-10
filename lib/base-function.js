import { logger } from './logger.js';

export class BaseFunction {
  constructor(args) {
    if (new.target === BaseFunction) {
      throw new TypeError("Cannot construct abstract instances directly");
    }

    this.args = args || {};
  }

  static get description() {
    throw new Error('Not implemented');
  }

  static get supportedArgs() {
    return {
      requestor: {
        type: "string",
        description: "The name of the user questing the function call",
      },
    };
  }

  static get requiredArgs() {
    return ['requestor'];
  }

  static get metadata() {
    let metadata = {
      name: this.name,
      description: this.description,
      parameters: {
        type: "object",
        properties: this.supportedArgs,
        required: this.requiredArgs,
      },
    };

    return metadata;
  }

  async call() {
    logger.info({args: this.args}, `Calling ${this.constructor.name}...`);
  }
}
