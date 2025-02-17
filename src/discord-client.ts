import { Client, IntentsBitField, Partials } from "discord.js";
import { config } from "dotenv";

export async function initDiscord(): Promise<Client<true>> {
  return await new Promise((resolve, reject) => {
    config({ path: ".env" });

    const client = new Client({
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildEmojisAndStickers,
        IntentsBitField.Flags.GuildMessageReactions
      ],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction]
    });

    client.on("ready", () => {
      console.log(
        `Logged into discord as ${client.user?.tag ?? "USER IS NULL"}!`,
      );

      const maintainerIds = process.env.MAINTAINERS?.split(",") ?? [];
      const serverId = process.env.CSSA_SERVER;
      if (serverId === undefined) {
        reject(new Error("CSSA_SERVER in .env is undefined"));
      } else {
        client.guilds
          .fetch(serverId)
          .then((server) => {
            for (const maintainerId of maintainerIds) {
              server.members
                .fetch(maintainerId)
                .then((maintainer) => {
                  appMaintainers.push(maintainer);
                })
                .catch(console.error);
            }
          })
          .catch(console.error);
      }

      if (client.isReady()) {
        client.guilds
          .fetch(process.env.CSSA_SERVER!)
          .then((guild) => guild.members.fetch())
          .then(() => resolve(client))
          .catch(reject);
      } else {
        reject(
          new Error("client.on('ready') fired but client.isReady() is false."),
        );
      }
    });

    client.login(process.env.DISCORD_TOKEN).catch(reject);
  });
}
