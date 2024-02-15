import express from "express";

import { initDiscord } from "./discord-client";
import { attachDoorServer } from "./door-status";
import addReactionEvents from "./reacts";
import { attachBaserowWebhookListener } from "./baserow-integration";
import { startServerIcon } from "./server-icon";

const PORT = 8080;
globalThis.appMaintainers = [];

async function main(): Promise<void> {
  // Initialise the discord client
  // The type of globalThis.discordClient is strictly defined, so we're making an implicit contract
  // with any subsequent code using it that the value will exist and be of the correct type.
  // This means that this line must be executed before any other code that uses globalThis.discordClient.
  globalThis.discordClient = await initDiscord();

  // Initialise the express app and attach the door server
  const expressApp = express();
  await attachDoorServer(expressApp);
  await attachBaserowWebhookListener(expressApp);

  // Start the server icon and add reaction events
  startServerIcon();
  addReactionEvents();

  // Make all other http requests go to cssa.club
  expressApp.get("*", function (_, response) {
    response.redirect("https://cssa.club/");
  });

  expressApp.listen(PORT, () => {
    console.log(`CROBot listening on ${PORT}`);
  });

  console.log("Finished initialisation");
}

main().catch(console.error);
