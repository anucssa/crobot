import { NocoDBWebhook, DBGetRowsResponse, DBItem } from "./nocodb-types";
import express, { Express, Request } from "express";
import { GuildMember, Snowflake } from "discord.js";

const MEMBER_ROLE_ID = "753524901708693558";
const LIFE_MEMBER_ROLE_ID = "702889882598506558";
const CSSA_SERVER_ID = process.env.CSSA_SERVER as Snowflake;
const DB_REQUEST_URL =
  "https://db.cssa.club/api/v2/tables/mj43d15qwi3hi8p/records?fields=id%2Cdiscord_username%2Clife_member%2Ccommittee%2Ccro&where=where%3D%28discord_username%2Cisnot%2Cnull%29&limit=1000&shuffle=0&offset=0";

if (!CSSA_SERVER_ID) throw new Error("CSSA_SERVER not set.");

function transformUsername(username: string): [string, number];
function transformUsername(
  username: string | null,
): [string, number] | undefined {
  if (username === null) return undefined;
  // New discord names are stored lowercase, and case insensitive
  if (!username.includes("#")) {
    username = username.toLowerCase();
    return [username, 0];
  }
  const [name, discriminator] = username.split("#");
  return [name, Number.parseInt(discriminator, 10)];
}

interface DBItemDiscord {
  item: DBItem;
  discord: GuildMember;
}

async function getDatabaseItemDiscord(
  item: DBItem,
): Promise<DBItemDiscord | undefined> {
  try {
    return {
      item,
      discord: await getUser(item.discord_username),
    };
  } catch {
    return undefined;
  }
}

export async function refreshDBData() {
  // Fire events for onRowCreate, onRowUpdate, onRowDelete as necessary

  // Force update all discord members
  await Promise.all([cssaGuild.fetch(), cssaGuild.members.fetch()]);

  const databaseResp: DBGetRowsResponse = await fetch(DB_REQUEST_URL, {
    headers: new Headers({
      "xc-token": process.env.NOCODB_TOKEN || "",
    }),
  }).then((response) => response.json());
  const fetchedData = databaseResp.list;

  // Associate a discord user for each entry
  const itemsDiscordPromises: Promise<DBItemDiscord | undefined>[] = [];
  for (const row of fetchedData) {
    itemsDiscordPromises.push(getDatabaseItemDiscord(row));
  }

  const itemsDiscordProm = await Promise.all(itemsDiscordPromises);
  const itemsDiscord = itemsDiscordProm.flatMap((f) => (f ? [f] : []));
  const discordUsers: Set<GuildMember> = new Set();

  // Get a set of discord users
  for (const row of itemsDiscord) {
    if (discordUsers.has(row.discord)) {
      console.log(
        `Warning: User ${row.item.discord_username} exists twice in db.`,
      );
    } else {
      discordUsers.add(row.discord);
    }
  }

  // Sync each found user
  const eventPromises: Promise<unknown>[] = [];
  for (const row of itemsDiscord) {
    eventPromises.push(onRowUpdate(row));
  }

  // Drop any members not in the fetched data
  const memberRole = await cssaGuild.roles.fetch(MEMBER_ROLE_ID);
  if (!memberRole) throw new Error("Couldn't get member role.");

  for (const member of memberRole.members.values()) {
    if (discordUsers.has(member)) continue;
    eventPromises.push(onRowDelete(member));
  }

  return Promise.all(eventPromises).then(() => {
    console.log("DB data refreshed.");
  });
}

export async function attachNocoDBWebhookListener(expressApp: Express) {
  await refreshDBData();

  expressApp.use(express.json());

  expressApp.post(
    "/membership/update",
    async (request: Request<NocoDBWebhook>, response) => {
      if (request.headers["x-cssa-secret"] != process.env.WEBSOCKET_SECRET) {
        console.warn("Illegal websocket update.");
        response.status(401).send();
        return;
      }
      console.log("Received db webhook.");
      const webhookBody: NocoDBWebhook = request.body;

      // Collect all async operations for better concurrency
      const promises: Promise<void>[] = [];

      switch (webhookBody.type) {
        case "records.after.insert": {
          for (const item of webhookBody.data.rows) {
            promises.push(
              getDatabaseItemDiscord(item).then((index) => {
                if (index) onRowUpdate(index);
              }),
            );
          }
          break;
        }
        case "records.after.update": {
          const ids = new Set<string>();
          for (const item of webhookBody.data.rows) {
            ids.add(item.discord_username);
            promises.push(
              getDatabaseItemDiscord(item).then((index) => {
                if (index) onRowUpdate(index);
              }),
            );
          }
          for (const item of webhookBody.data.previous_rows) {
            if (!ids.has(item.discord_username)) {
              promises.push(
                getDatabaseItemDiscord(item).then((index) => {
                  if (index) onRowDelete(index.discord);
                }),
              );
            }
          }
          break;
        }
        case "rows.after.delete": {
          for (const item of webhookBody.data.rows) {
            promises.push(
              getDatabaseItemDiscord(item).then((index) => {
                if (index) onRowDelete(index.discord);
              }),
            );
          }
          break;
        }
      }
      response.status(204).send();
      await Promise.all(promises);
    },
  );
}

class MemberNotFoundError extends Error {}

async function getUser(rawUsername: string): Promise<GuildMember> {
  const [username, discriminator] = transformUsername(rawUsername);
  for (const member of cssaGuild.members.cache.values()) {
    if (
      member.user.username === username &&
      member.user.discriminator === discriminator.toString(10)
    )
      return member;
  }
  const fetchedMembers = await cssaGuild.members.fetch({ query: username });
  for (const member of fetchedMembers.values()) {
    if (
      member.user.username === username &&
      member.user.discriminator === discriminator.toString(10)
    )
      return member;
  }
  console.log(`Couldn't find member in guild: ${username}#${discriminator}`);
  throw new MemberNotFoundError("Couldn't find member in guild: " + username);
}

export async function performRoleUpdate(
  member: GuildMember,
  roleId: string,
  operation: "add" | "remove",
) {
  const alreadySatisfied =
    operation === "add"
      ? member.roles.cache.has(roleId)
      : !member.roles.cache.has(roleId);

  if (alreadySatisfied) {
    return;
  }
  console.log(
    `Performing role update: ${operation} ${roleId} for ${member.user.username}`,
  );
  await (operation === "add"
    ? member.roles.add(roleId)
    : member.roles.remove(roleId));
}

export async function onRowUpdateWebhook(row: DBItem) {
  getUser(row.discord_username);
}

export async function onRowUpdate(row: DBItemDiscord) {
  const discord = row.discord;
  await performRoleUpdate(discord, MEMBER_ROLE_ID, "add");
  if (row.item.life_member) {
    await performRoleUpdate(discord, LIFE_MEMBER_ROLE_ID, "add");
  }
}

export async function onRowDelete(row: GuildMember) {
  await performRoleUpdate(row, MEMBER_ROLE_ID, "remove");
}
