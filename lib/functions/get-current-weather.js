import { Client } from "@googlemaps/google-maps-services-js";
import { default as axios } from "axios";

import * as wmoCodeDictionary from '../../res/wmo-code-dictionary.json' with { type: 'json' };
import { BaseFunction } from "../base-function.js";
import { logger } from '../logger.js';

export default class GetCurrentWeather extends BaseFunction {
  static get description() {
    return "Get the current weather in a given location";
  }

  static get supportedArgs() {
    const supportedArgs = {
      location: {
        type: "string",
        description: "The location, in the format of a city name and province/state code, separated by a comma",
      },
    };
    return {
      ...super.supportedArgs,
      ...supportedArgs,
    };
  }

  static get requiredArgs() {
    return super.requiredArgs;
  }

  async call() {
    super.call();

    const location = this.args.location || "Halifax, NS";
    
    const locationData = await this.geocode(location);
    const weatherReport = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: locationData.geometry.location.lat,
        longitude: locationData.geometry.location.lng,
        windspeed_unit: 'kn',
        current_weather: true,
      }
    });

    let currentWeather = {
      location: locationData.formatted_address,
      latitude: locationData.geometry.location.lat,
      longitude: locationData.geometry.location.lng,
      temperature: {
        value: weatherReport.data.current_weather.temperature,
        unit: 'degrees celcius',
      },
      wind: {
        speed: {
          value: weatherReport.data.current_weather.windspeed,
          unit: 'knots',
        },
        direction: {
          value: weatherReport.data.current_weather.winddirection,
          unit: 'degrees',
        },
      },
    }

    const wmoCodeCategory = wmoCodeDictionary.default[weatherReport.data.current_weather.weathercode.toString()];

    if (wmoCodeCategory) {
      if (weatherReport.data.current_weather.is_day === 1) {
        currentWeather.conditions = wmoCodeCategory["day"]["description"];
      } else {
        currentWeather.conditions = wmoCodeCategory["night"]["description"];
      }
    }

    return currentWeather;
  }

  async geocode(location) {
    const client = new Client({});
    const response = await client.geocode({
      params: {
        address: location,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });
    return response.data.results[0];
  }
}
