import {
  ChatInputCommandInteraction,
  Collection,
  GuildMember,
  SlashCommandBuilder
} from 'discord.js'

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, CommandDefinition>
    maintainers: Set<GuildMember>
  }
}

declare global {
  interface CommandDefinition {
    data: SlashCommandBuilder
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>
  }
}
