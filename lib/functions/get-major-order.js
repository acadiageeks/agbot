import { default as axios } from "axios";

import { BaseFunction } from "../base-function.js";
import { logger } from '../logger.js';

export default class GetMajorOrder extends BaseFunction {
  static get description() {
    return "Get the current Major Order in Helldivers 2";
  }

  async call() {
    super.call();

    const response = await axios.get('https://api.helldivers2.dev/api/v1/assignments', null, {headers: {
      'accept': 'application/json',
      'X-Super-Client': 'agbot',
    }});
    const majorOrderInfo = response.data[0];

    let majorOrder = {
      briefing: majorOrderInfo['briefing'],
      description: majorOrderInfo['description'],
      reward: `${majorOrderInfo['reward']['amount']} medals`,
    };

    return majorOrder;
  }
}
