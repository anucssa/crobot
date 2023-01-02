import { Client, GatewayIntentBits } from 'discord.js'
import { config } from 'dotenv'

export async function initDiscord (): Promise<Client<true>> {
  return await new Promise((resolve, reject) => {
    config()

    const client = new Client({ intents: [GatewayIntentBits.Guilds] })

    client.on('ready', () => {
      client.user?.setPresence({
        activities: [{
          name: 'the door sensor boot',
          type: 3
        }],
        status: 'idle'
      })
      console.log(`Logged into discord as ${client.user?.tag ?? 'USER IS NULL'}!`)
      resolve(client)
    })

    client.login(process.env.DISCORD_TOKEN).catch(reject)
  })
}
