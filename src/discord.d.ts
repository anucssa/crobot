import {
  type ChatInputCommandInteraction,
  type Collection, type ContextMenuCommandBuilder,
  type GuildMember, type MessageContextMenuCommandInteraction,
  type SlashCommandBuilder
} from 'discord.js'
import type MembershipStore from './memberships/membership-store'

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, CommandDefinition>
    maintainers: Set<GuildMember>
    membershipStore: MembershipStore
  }
}

declare global {
  interface SlashCommandDefinition {
    data: SlashCommandBuilder
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>
  }

  interface ContextMenuCommandDefinition {
    data: ContextMenuCommandBuilder
    execute: (interaction: MessageContextMenuCommandInteraction) => Promise<void>
  }
}
