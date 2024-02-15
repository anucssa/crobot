import express, { type Express, Request } from "express";
import { GuildMember, type Client, Guild, Role } from "discord.js";
import { BASEROW_ITEM_FIELDS, BaserowItem, BaserowWebhook } from "./baserow";

export class MembershipWatcher {
  private readonly app: Express;
  private readonly discordClient: Client<boolean>;
  private cssa: Guild | undefined;
  private memberRole: Role | undefined;
  private lifeMemberRole: Role | undefined;

  constructor(discordClient: Client, express: Express) {
    this.discordClient = discordClient;
    this.app = express;
  }

  private async getUser(
    username: string | null,
  ): Promise<GuildMember | undefined> {
    if (!username) return undefined;
    // New discord names are stored lowercase, and case insensitive
    if (!username.includes("#")) {
      username = username.toLowerCase();
    }

    const member = await this.cssa?.members.fetch({ query: username });
    for (const m of member?.values() ?? []) {
      if (m.user.username === username) return m;
    }
    return undefined;
  }

  private async updateMembershipRole(
    usersWithRole: Set<GuildMember>,
    targetSet: Set<GuildMember>,
  ) {
    const member = this.memberRole;
    if (!member) throw new Error("Null member role");

    for (const u of usersWithRole) {
      if (!targetSet.has(u)) {
        await u.roles.remove(member);
      }
    }

    for (const u of targetSet) {
      if (!usersWithRole.has(u)) {
        await u.roles.add(member);
      }
    }
  }

  private async fetchBaserowUsers(): Promise<Set<GuildMember>> {
    const response = await fetch(
      "https://baserow.cssa.club/api/database/rows/table/511/?size=5000",
      {
        headers: {
          Authorization: "Token " + process.env.BASEROW_TOKEN,
        },
      },
    );
    const tableData: { results: BaserowItem[] } = await response.json();

    const set = new Set<GuildMember>();

    for (const item of tableData.results) {
      const userName = item[BASEROW_ITEM_FIELDS.DISCORD_USERNAME];
      if (userName === null) continue;
      const user = await this.getUser(userName);
      if (user) set.add(user);
    }

    return set;
  }

  public async flushMembers() {
    console.log("Flushing members");
    if (!this.cssa || !this.memberRole || !this.lifeMemberRole)
      throw new Error("Null element");

    await this.cssa.members.fetch();
    const withRole = new Set(this.memberRole.members.map((u) => u));
    const targetSet = await this.fetchBaserowUsers();

    // Add life members to targetSet
    for (const u of this.lifeMemberRole.members.values()) {
      targetSet.add(u);
    }

    await this.updateMembershipRole(withRole, targetSet);
  }

  public async startServer(): Promise<void> {
    if (!this.discordClient.isReady())
      throw new Error(
        "Membersip Watcher initialised before discord client ready.",
      );

    this.cssa = await this.discordClient.guilds.fetch(
      process.env.CSSA_SERVER || "",
    );

    if (!this.cssa) throw new Error("Couldn't fetch CSSA guild data.");

    await this.cssa.roles.fetch();

    this.memberRole = this.cssa.roles.cache.get("753524901708693558");
    this.lifeMemberRole = this.cssa.roles.cache.get("702889882598506558");
    if (!this.memberRole || !this.lifeMemberRole)
      throw new Error("Couldn't get roles.");

    await this.flushMembers();

    this.app.use(express.json());

    this.app.post(
      "/membership/update",
      async (request: Request<BaserowWebhook>, response) => {
        if (request.headers["x-cssa-secret"] != process.env.WEBSOCKET_SECRET) {
          console.log("Illegal websocket update.");
          response.status(401).send();
          return;
        }
        console.log("Got membership update.");
        await this.cssa?.members.fetch();

        const webhookBody: BaserowWebhook = request.body;
        const old_users = new Set<GuildMember>();
        const new_users = new Set<GuildMember>();

        // Collect all async operations for better concurrency
        const promises: Promise<void>[] = [];

        if (webhookBody.event_type == "rows.updated") {
          for (const item of webhookBody.old_items) {
            if (item[BASEROW_ITEM_FIELDS.DISCORD_USERNAME] === null) continue;
            promises.push(
              this.getUser(item[BASEROW_ITEM_FIELDS.DISCORD_USERNAME]).then(
                (user) => {
                  if (user) old_users.add(user);
                },
              ),
            );
          }
        }
        if (
          webhookBody.event_type == "rows.created" ||
          webhookBody.event_type == "rows.updated"
        ) {
          for (const item of webhookBody.items) {
            if (item[BASEROW_ITEM_FIELDS.DISCORD_USERNAME] === null) continue;
            promises.push(
              this.getUser(item[BASEROW_ITEM_FIELDS.DISCORD_USERNAME]).then(
                (user) => {
                  if (user) new_users.add(user);
                },
              ),
            );
          }
        }

        await Promise.all(promises);

        await this.updateMembershipRole(old_users, new_users);

        response.status(204).send();
      },
    );
  }
}
