import express from "express";

import { initDiscord } from "./discord-client";
import { DoorServer } from "./door-status";
import serverIcon from "./icons/server-icon";
import addReactionEvents from "./reacts";
import { MembershipWatcher } from "./membership-watcher";

const PORT = 8080;

async function main(): Promise<void> {
  const expressApp = express();

  const client = await initDiscord();
  const doorServer = new DoorServer(client, expressApp);
  const membershipWatcher = new MembershipWatcher(client, expressApp);
  client.membershipWatcher = membershipWatcher;
  serverIcon(client);
  addReactionEvents(client);

  await membershipWatcher.startServer();
  await doorServer.startServer();

  // Make all other http requests go to cssa.club
  expressApp.get("*", function (request, response) {
    response.redirect("https://cssa.club/");
  });

  expressApp.listen(PORT, () => {
    console.log(`CROBot listening on ${PORT}`);
  });

  console.log("Finished initialisation");
}

main().catch(console.error);
