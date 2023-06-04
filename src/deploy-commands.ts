// Run this file after updating commands to deploy them to the CSSA server
// I absolutely just yeeted this from the discord.js guide
import { REST, Routes } from 'discord.js'
import fs from 'node:fs/promises'
import { config } from 'dotenv'

async function main (): Promise<void> {
  config({ path: '.env' })

  const commands: Array<ReturnType<CommandDefiniton['data']['toJSON']>> = []
  // Grab all the command files from the commands directory you created earlier
  let commandFiles = await fs.readdir(process.env.NODE_ENV === 'development' ? './dist/commands/' : '/usr/local/libexec/crobot/dist/commands/')
  commandFiles = commandFiles.filter(file => file.endsWith('.js'))

  // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    const command: CommandDefiniton = await import(`./commands/${file}`)
    commands.push(command.data.toJSON())
  }

  // Construct and prepare an instance of the REST module
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN ?? '')

  // and deploy your commands!

  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`)

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID ?? '', process.env.CSSA_SERVER ?? ''),
      { body: commands }
    )

    console.log(`Successfully reloaded ${(data as never[]).length} application (/) commands.`)
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error)
  }
}

await main()
