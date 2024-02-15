/* eslint-disable no-var */
// noinspection ES6ConvertVarToLetConst

import { Client, Guild, GuildMember } from "discord.js";

declare global {
  var discordClient: Client<true>;
  var cssaGuild: Guild;
  var appMaintainers: GuildMember[];
}
