import {
  ChatInputCommandInteraction,
  Collection, ContextMenuCommandBuilder,
  GuildMember, MessageContextMenuCommandInteraction,
  SlashCommandBuilder
} from 'discord.js'

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, CommandDefinition>
    maintainers: Set<GuildMember>
  }
}

declare global {
  type CommandDefiniton = SlashCommandDefinition | ContextMenuCommandDefinition

  interface SlashCommandDefinition {
    data: SlashCommandBuilder
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>
  }

  interface ContextMenuCommandDefinition {
    data: ContextMenuCommandBuilder
    execute: (interaction: MessageContextMenuCommandInteraction) => Promise<void>
  }
}
