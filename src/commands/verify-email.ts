import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder
} from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('verifyemail')
  .setDescription('Link your discord account to a QPay Membership via email.')
  .setDMPermission(false)

export async function execute (interaction: ChatInputCommandInteraction<'cached'>): Promise<void> {
  if (interaction.member === null) {
    throw new Error('Interaction member is null')
  } else if (interaction.channel === null) {
    throw new Error('Interaction channel is null')
  }

  if (interaction.inRawGuild()) {
    throw new Error('Raw guild')
  }

  await interaction.client.membershipStore.emailVerificationManager.handleVerificationInteraction(interaction)
}
