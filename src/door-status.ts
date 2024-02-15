import express, { type Express } from "express";

const TEN_MINUTES = 1000 * 60 * 10;

// Helper functions to set the presence text and status channel name
const setPresenceText = (text: string) =>
  discordClient.user.setPresence({
    activities: [
      {
        name: text,
        type: 3,
      },
    ],
    status: "idle",
  });

export async function attachDoorServer(app: Express) {
  if (!discordClient?.isReady())
    throw new Error(
      "Door Status Server initialised before discord client ready.",
    );

  // Get the channel from the CSSA discord server
  const cssaGuild = await discordClient.guilds.fetch("476382037620555776");

  const statusChannel =
    (await cssaGuild.channels.fetch("1060799214550007849")) ?? undefined;
  if (statusChannel === undefined)
    throw new Error("Could not find status channel");
  if (statusChannel.isVoiceBased() === false)
    throw new Error("Status channel is not a voice channel");
  const setStatusChannelName = (name: string) => statusChannel.setName(name);

  setPresenceText("the door sensor boot");
  await setStatusChannelName("CR is loading...");

  // Assume the door is closed until we hear otherwise
  let status: boolean = false;

  // Set a timer to show an error message if the sensor doesn't check in
  let timer: NodeJS.Timeout | undefined = setTimeout(() => {
    timeout();
  }, TEN_MINUTES);

  const timeout = () => {
    setPresenceText("sensor dead poke #general");
    setStatusChannelName("CR is missing :|");
    timer = undefined;
  };

  // Configure the express app
  app.use(express.urlencoded({ extended: true }));

  // Expose the status of the door sensor to other apps
  app.get("/commonRoom/status", (_, response) => {
    response.set("Content-Type", "application/json");
    response.send(JSON.stringify({ status }));
  });

  // Listen for updates from the door sensor
  app.post("/commonRoom/status", (request, response) => {
    // Validate the request with a secret code
    if (request.body.code !== process.env.STATUS_PWD) {
      response.end("Invalid code");
      return;
    }
    // Update the status and the presence text
    if (request.body.state === "1") {
      status = true;
      setPresenceText("room is Open ✨");
      setStatusChannelName("CR is open!");
    } else {
      status = false;
      setPresenceText("room is Closed");
      setStatusChannelName("CR is closed");
    }

    // Reset timer for the next check-in
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timeout();
    }, TEN_MINUTES);

    // Send a response to the sensor to confirm the status update
    response.end(request.body.status);
  });
}
