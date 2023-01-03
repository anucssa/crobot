import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('error')
  .setDescription('Error handling test command.')

export async function execute (interaction: ChatInputCommandInteraction): Promise<void> {
  throw new Error('Oops')
}
