/* eslint-disable no-var */
// noinspection ES6ConvertVarToLetConst

import { Client, GuildMember } from "discord.js";

declare global {
  var discordClient: Client<true>;
  var appMaintainers: GuildMember[];
}
