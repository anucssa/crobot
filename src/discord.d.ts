import {
  ChatInputCommandInteraction,
  Collection, ContextMenuCommandBuilder,
  GuildMember, MessageContextMenuCommandInteraction,
  SlashCommandBuilder
} from 'discord.js'
import MembershipStore from './memberships/membershipStore'

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, CommandDefinition>
    maintainers: Set<GuildMember>
    membershipStore: MembershipStore
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
