import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionsBitField,
} from "discord.js";
import { refreshBaserowData } from "../baserow-integration";

export const data = new SlashCommandBuilder()
  .setName("flushmembers")
  .setDescription(
    "Reset all members to the state in the db, except life members who always get the member role.",
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
  .setDMPermission(false);

export async function execute(
  interaction: ChatInputCommandInteraction<"cached">,
): Promise<void> {
  if (interaction.member === null) {
    throw new Error("Interaction member is null");
  } else if (interaction.channel === null) {
    throw new Error("Interaction channel is null");
  }

  if (interaction.inRawGuild()) {
    throw new Error("Raw guild");
  }

  if (
    !interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)
  ) {
    await interaction.reply({
      content:
        "You do not have permission to use this command. Also you shouldn't see this.",
      ephemeral: true,
    });
    return;
  }

  await refreshBaserowData();

  await interaction.reply({
    content: "Members role flushed.",
    ephemeral: true,
  });
}
