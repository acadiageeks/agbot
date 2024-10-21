import { SlashCommandBuilder } from 'discord.js';

export const metadata = new SlashCommandBuilder()
  .setName('react')
  .setDescription('Insert a reaction image')
  .addStringOption(option =>
		option.setName('image')
			.setDescription('The name of the reaction image')
			.setRequired(true)
			.addChoices(
				{ name: 'Racism for a third time?', value: 'https://acadiageeks.com/gifs/racism-for-a-third-time.gif' },
				{ name: 'You know what? I\'m starting to like it', value: 'https://acadiageeks.com/gifs/im-starting-to-like-it.gif' },
				{ name: 'Fatsquatch', value: 'https://acadiageeks.com/gifs/fatsquatch.gif' },
			));

export async function handler(interaction) {
  const image = interaction.options.getString('image');
  await interaction.channel.send(image);
  await interaction.reply({ content: 'Done!', ephemeral: true });
}
