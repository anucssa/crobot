import { Client, Collection, Events } from 'discord.js'
import path from 'path'
import * as fs from 'fs/promises'

export default async function registerCommands (client: Client): Promise<void> {
  client.commands = new Collection()

  const commandsPath = path.join(__dirname, 'commands')
  let commandFiles = await fs.readdir(commandsPath)
  commandFiles = commandFiles.filter((file) => file.endsWith('.js'))

  await Promise.all(commandFiles.map(async (file) => {
    const filePath = path.join(commandsPath, file)
    const command = await import(filePath)
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- Weird eslint misfire ¯\_(ツ)_/¯
    if (Object.hasOwn(command, 'data') && Object.hasOwn(command, 'execute')) {
      client.commands.set(command.data.name, command)
    } else {
      console.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`)
    }
  }))

  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return

    const command = interaction.client.commands.get(interaction.commandName)

    if (command == null) {
      console.error(`No command matching ${interaction.commandName} was found.`)
      return
    }

    try {
      await command.execute(interaction)
    } catch (error) {
      console.error(error)
      const maintainers: string[] = []
      for (const maintainer of client.maintainers) {
        maintainers.push(`<@${maintainer.id}>`)
      }
      let maintainersText = ''
      if (maintainers.length === 1) {
        maintainersText += `Please ping ${maintainers[0]}.`
      } else if (maintainers.length > 1) {
        maintainers[maintainers.length - 1] = 'or ' + maintainers[maintainers.length - 1]
        maintainersText = maintainers.join(', ')
      }
      await interaction.reply({ content: `There was an error while executing this command! ${maintainersText}`, ephemeral: true })
    }
  })
}
