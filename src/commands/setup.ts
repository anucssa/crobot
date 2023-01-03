import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Helps you set up your roles.')

export async function execute (interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.reply('Test')
}
