import { Client, Events, Collection, REST, Routes, GatewayIntentBits } from 'discord.js';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { readdir } from 'node:fs/promises';

import { handler as mentionHandler } from './events/mention.js';
import { logger } from './logger.js';
import * as pkg from '../package.json' assert { type: 'json' };

export const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ]
});

bot.initialize = async () => {
  // dynamically load all defined commands in the commands directory
  const commandsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'commands');
  const directoryEntities = await readdir(commandsDir);
  const commandFilenames = directoryEntities.filter((entity) => entity.endsWith('.js'));

  bot.handlers = new Collection();
  let commandRegistrationPayload = [];

  for (const commandFilename of commandFilenames) {
    const commandPath = path.join(commandsDir, commandFilename);
    const { metadata, handler } = await import(commandPath);

    let commandName = metadata.name;
    if (process.env.DEV_MODE === 'true') {
      commandName += '-dev';
    }

    bot.handlers.set(commandName, handler);
    let json = metadata.toJSON();
    json.name = commandName;
    commandRegistrationPayload.push(json);
  }

  // register all commands with Discord
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  await rest.put(
    Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
    { body: commandRegistrationPayload },
  );

  const commandNames = [ ...bot.handlers.keys() ];
  logger.info(`Initialized ${commandNames.length} commands: ${commandNames}`);
};

bot.once(Events.ClientReady, async (c) => {
  logger.info(`agbot v${pkg.default.version} is up and running as ${c.user.tag}!`);
});

bot.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

  let commandName = interaction.commandName;
  if (process.env.DEV_MODE === 'true' && commandName.endsWith('-dev') === false) {
    commandName += '-dev';
  }
	
  const handler = interaction.client.handlers.get(commandName);

	if (!handler) {
		logger.error(`No handler for the ${commandName} command is available.`);
		return;
	}

  try {
		await handler(interaction);
	} catch (error) {
		logger.error(error);

		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

bot.on(Events.MessageCreate, async (message) => {
  if (message.mentions.users.has(bot.user.id)) {
    await mentionHandler(bot, message);
  }
});
