import express, { type Express } from "express";
import {
  type Client,
  type VoiceBasedChannel,
  type VoiceChannel,
} from "discord.js";

const TEN_MINUTES = 1000 * 60 * 10;

export class DoorServer {
  private readonly app: Express;
  private timer?: NodeJS.Timeout = undefined;
  private readonly discordClient: Client<true>;
  private statusChannel: VoiceBasedChannel | undefined;
  private status = false;

  constructor(discordClient: Client, express: Express) {
    this.discordClient = discordClient;
    this.app = express;
  }

  public async startServer(): Promise<void> {
    if (!this.discordClient.isReady())
      throw new Error(
        "Door Status Server initialised before discord client ready.",
      );

    const cssa = await this.discordClient.guilds.fetch("476382037620555776");
    const statusChannel =
      (await cssa.channels.fetch("1060799214550007849")) ?? undefined;
    if (statusChannel?.isVoiceBased() === true) {
      this.statusChannel = statusChannel as VoiceChannel;
    }
    if (this.statusChannel === undefined)
      throw new Error("Could not find status channel");

    this.discordClient.user?.setPresence({
      activities: [
        {
          name: "the door sensor boot",
          type: 3,
        },
      ],
      status: "idle",
    });
    await this.statusChannel?.setName("CR is loading...");

    this.app.use(express.urlencoded({ extended: true }));

    this.app.get("/commonRoom/status", (request, response) => {
      response.set("Content-Type", "application/json");
      response.send(JSON.stringify({ status: this.status }));
    });

    this.app.post("/commonRoom/status", (request, response) => {
      this.updateCommonRoomStatus(request, response);
    });

    this.timer = setTimeout(() => {
      this.timeout();
    }, TEN_MINUTES);
  }

  private updateCommonRoomStatus(
    request: Parameters<Parameters<typeof this.app.post>[1]>[0],
    response: Parameters<Parameters<typeof this.app.post>[1]>[1],
  ): void {
    if (this.discordClient === undefined)
      throw new Error("Discord Client not set");
    console.debug(JSON.stringify(request.body));
    if (request.body.code === process.env.STATUS_PWD) {
      if (request.body.state === "1") {
        this.discordClient.user.setPresence({
          activities: [
            {
              name: "room is Open ✨",
              type: 3,
            },
          ],
          status: "online",
        });
        this.status = true;
        void this.statusChannel?.setName("CR is open!");
      } else {
        this.discordClient.user.setPresence({
          activities: [
            {
              name: "room is Closed",
              type: 3,
            },
          ],
          status: "dnd",
        });
        this.status = false;
        void this.statusChannel?.setName("CR is closed");
      }

      // Reset timer
      if (this.timer !== null) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.timeout();
      }, TEN_MINUTES);
      response.end(request.body.status);
    } else {
      response.end("Invalid code");
    }
  }

  private timeout(): void {
    if (this.discordClient === undefined)
      throw new Error("Discord Client not set");
    this.discordClient.user.setPresence({
      activities: [
        {
          name: "sensor dead poke #general",
          type: 3,
        },
      ],
      status: "idle",
    });
    void this.statusChannel?.setName("CR is missing :|");
    this.timer = undefined;
  }
}
