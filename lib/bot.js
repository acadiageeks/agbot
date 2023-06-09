import { Client, Events, Collection, REST, Routes, GatewayIntentBits } from 'discord.js';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { readdir } from 'node:fs/promises';

import { logger } from './logger.js';
import * as pkg from '../package.json' assert { type: 'json' };

export const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
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

    bot.handlers.set(metadata.name, handler);
    commandRegistrationPayload.push(metadata.toJSON());
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
	
  const handler = interaction.client.handlers.get(interaction.commandName);

	if (!handler) {
		logger.error(`No handler for the ${interaction.commandName} command is available.`);
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
