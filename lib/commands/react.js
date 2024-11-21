import { SlashCommandBuilder } from 'discord.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const metadata = new SlashCommandBuilder()
  .setName('react')
  .setDescription('Insert a reaction image')
  .addStringOption(option =>
		option.setName('image')
			.setDescription('The name of the reaction image')
			.setRequired(true)
			.addChoices(
				{ name: 'Racism for a third time?', value: 'racism-for-a-third-time.gif' },
				{ name: 'You know what? I\'m starting to like it', value: 'im-starting-to-like-it.gif' },
				{ name: 'Son, I am disappoint', value: 'fatsquatch.gif' },
				{ name: 'Kekskull', value: 'kekskull.png' },
				{ name: 'Fancy dance (Jon)', value: 'fancy-dance-jon.gif' },
				{ name: 'Fancy dance (Ross)', value: 'fancy-dance-ross.gif' },
			));

export async function handler(interaction) {
  const image = interaction.options.getString('image');
	const imagePath = path.resolve(__dirname, '..', '..', 'assets', image);

  await interaction.reply({files: [imagePath]});
}
