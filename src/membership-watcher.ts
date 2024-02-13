import express, { type Express } from "express";
import { GuildMember, type Client, Guild, Role } from "discord.js";

export class MembershipWatcher {
  private readonly app: Express;
  private readonly discordClient: Client<true>;
  private cssa: Guild | undefined;
  private member_role: Role | undefined;
  private lifemember_role: Role | undefined;

  constructor(discordClient: Client, express: Express) {
    this.discordClient = discordClient;
    this.app = express;
  }

  private getUser(id: String): GuildMember | undefined {
    return this.cssa?.members.cache.find((u) => u.user.username == id);
  }

  private async updateMembershipRole(
    usersWithRole: Set<GuildMember>,
    targetSet: Set<GuildMember>,
  ) {
    const member = this.member_role;
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

  private async fetchDBUsers(): Promise<Set<GuildMember>> {
    const response = await fetch(
      "https://baserow.cssa.club/api/database/rows/table/511/",
      {
        headers: {
          Authorization: "Token " + process.env.BASEROW_TOKEN,
        },
      },
    );
    const json = await response.json();

    let set = new Set<GuildMember>();

    for (const item of json.results) {
      const user = this.getUser(item.field_4760);
      if (user) set.add(user);
    }

    return set;
  }

  public async flushMembers() {
    console.log("Flushing members");
    if (!this.cssa || !this.member_role || !this.lifemember_role)
      throw new Error("Null element");

    await this.cssa.members.fetch();
    let withRole = new Set(this.member_role.members.map((u) => u));
    let targetSet = await this.fetchDBUsers();

    // Add life members to targetSet
    this.lifemember_role.members.forEach((u) => targetSet.add(u));

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

    if (!this.cssa) throw new Error();

    await this.cssa.roles.fetch();

    this.member_role = this.cssa.roles.cache.get("753524901708693558");
    this.lifemember_role = this.cssa.roles.cache.get("702889882598506558");
    if (!this.member_role || !this.lifemember_role)
      throw new Error("Couldn't get roles.");

    await this.flushMembers();

    this.app.use(express.json());

    this.app.post("/membership/update", async (request, response) => {
      if (request.headers["x-cssa-secret"] != process.env.WEBSOCKET_SECRET) {
        console.log("Illegal websocket update.");
        response.status(401).send();
        return;
      }
      console.log("Got membership update.");
      await this.cssa?.members.fetch();

      const req = request.body;
      let old_users = new Set<GuildMember>();
      let new_users = new Set<GuildMember>();
      if (req.old_items) {
        for (const item of req.old_items) {
          const user = this.getUser(item.field_4760);
          if (user) old_users.add(user);
        }
      }
      if (req.items) {
        for (const item of req.items) {
          const user = this.getUser(item.field_4760);
          if (user) new_users.add(user);
        }
      }

      await this.updateMembershipRole(old_users, new_users);

      response.status(204).send();
    });
  }
}
