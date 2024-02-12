import { type Client, Collection, Events } from "discord.js";
import * as fs from "node:fs/promises";
import path from "node:path";

export default async function registerCommands(client: Client): Promise<void> {
  client.commands = new Collection();

  const commandsPath =
    process.env.NODE_ENV === "development"
      ? "./dist/commands/"
      : "/usr/local/libexec/crobot/dist/commands/";
  let commandFiles = await fs.readdir(commandsPath);
  commandFiles = commandFiles.filter((file) => file.endsWith(".js"));

  await Promise.all(
    commandFiles.map(async (file) => {
      const filePath =
        process.env.NODE_ENV === "development"
          ? "." + commandsPath + file
          : path.join(commandsPath, file);
      const command = await import(filePath);
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- Weird eslint misfire ¯\_(ツ)_/¯
      if (Object.hasOwn(command, "data") && Object.hasOwn(command, "execute")) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(
          `The command at ${filePath} is missing a required "data" or "execute" property.`,
        );
      }
    }),
  );

  client.on(Events.InteractionCreate, async (interaction) => {
    if (
      !interaction.isChatInputCommand() &&
      !interaction.isMessageContextMenuCommand()
    )
      return;

    const command = interaction.client.commands.get(interaction.commandName);

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
      for (const maintainer of client.maintainers) {
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
