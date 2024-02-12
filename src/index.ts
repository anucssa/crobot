import { initDiscord } from "./discord-client";
import { DoorServer } from "./door-status";
import serverIcon from "./icons/server-icon";
import addReactionEvents from "./reacts";

async function main(): Promise<void> {
  const client = await initDiscord();
  const doorServer = new DoorServer(client);
  serverIcon(client);
  addReactionEvents(client);
  await doorServer.startServer();
  console.log("Finished initialisation");
}

main().catch(console.error);
