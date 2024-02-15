import { Collection, Events, REST, Routes } from "discord.js";
import * as commandDefinitions from "./commands";

export default async function registerCommands(): Promise<void> {
  const commands = new Collection(Object.entries(commandDefinitions));

  // Deploy the command definitions to the Discord API
  const rest = new REST({ version: "10" }).setToken(
    process.env.DISCORD_TOKEN ?? "",
  );
  // The put method is used to fully refresh all commands in the guild with the current set
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID ?? "",
      process.env.CSSA_SERVER ?? "",
    ),
    {
      body: [...commands.values()].map((commandDefinition) =>
        commandDefinition.data.toJSON(),
      ),
    },
  );

  // Register the commands with the client
  discordClient.on(Events.InteractionCreate, async (interaction) => {
    if (
      !interaction.isChatInputCommand() &&
      !interaction.isMessageContextMenuCommand()
    )
      return;

    const command = commands.get(interaction.commandName);

    if (command === undefined || command === null) {
      console.error(
        `No command matching ${interaction.commandName} was found.`,
      );
      return;
    }

    try {
      // @ts-expect-error -- Eh, it's fine
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      const maintainers: string[] = [];
      for (const maintainer of appMaintainers) {
        maintainers.push(`<@${maintainer.id}>`);
      }
      let maintainersText = "";
      if (maintainers.length === 1) {
        maintainersText += `Please ping ${maintainers[0]}.`;
      } else if (maintainers.length > 1) {
        maintainers[maintainers.length - 1] =
          "or " + (maintainers.at(-1) ?? "");
        maintainersText = "Please ping " + maintainers.join(", ");
      }
      await interaction.reply({
        content: `There was an error while executing this command! ${maintainersText}`,
        ephemeral: true,
      });
    }
  });
}
