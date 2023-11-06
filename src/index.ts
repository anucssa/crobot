import { initDiscord } from './discord-client'
import { DoorServer } from './door-status'
import serverIcon from './icons/server-icon'

async function main (): Promise<void> {
  const client = await initDiscord()
  const doorServer = new DoorServer(client)
  serverIcon(client)
  await doorServer.startServer()
  console.log('Finished initialisation')
}

main().catch(console.error)
