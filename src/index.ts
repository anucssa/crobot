import { initDiscord } from './discord-client'
import { DoorServer } from './door-status'
import MembershipStore from './memberships/membership-store'
import ServerIconManager from './icons/server-icon-manager'

async function main (): Promise<void> {
  const client = await initDiscord()
  const doorServer = new DoorServer(client)
  const serverIconManager = new ServerIconManager(client)
  const membershipStore = new MembershipStore()
  client.membershipStore = membershipStore
  await doorServer.startServer()
  await membershipStore.init()
  // Don't await this as it's a long-running loop
  serverIconManager.iconLoop().catch(console.error)
  console.log('Finished initialisation')
}

main().catch(console.error)
