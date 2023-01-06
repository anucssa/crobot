import { initDiscord } from './discordClient'
import { DoorServer } from './doorStatus'
import { DayNightIcon } from './dayNightIcon'

async function main (): Promise<void> {
  const client = await initDiscord()
  const doorServer = new DoorServer(client)
  await doorServer.startServer()
  const dayNightIcon = new DayNightIcon(client)
  await dayNightIcon.updateIcon()
}

void main()
