import {
  type ChatInputCommandInteraction,
  type Collection,
  type ContextMenuCommandBuilder,
  type GuildMember,
  type MessageContextMenuCommandInteraction,
  type SlashCommandBuilder,
} from "discord.js";
import type MembershipWatcher from "./memberships/membership-watcher";

declare module "discord.js" {
  interface Client {
    commands: Collection<string, CommandDefinition>;
    maintainers: Set<GuildMember>;
    membershipWatcher: MembershipWatcher;
  }
}

declare global {
  type CommandDefinition =
    | SlashCommandDefinition
    | ContextMenuCommandDefinition;
  interface SlashCommandDefinition {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  }

  interface ContextMenuCommandDefinition {
    data: ContextMenuCommandBuilder;
    execute: (
      interaction: MessageContextMenuCommandInteraction,
    ) => Promise<void>;
  }
}
