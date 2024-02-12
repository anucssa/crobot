import { Client } from "discord.js";

// Do not use the global regex flag, as it will cause the regex to be stateful
const REACTIONS: [RegExp, string][] = [
  [/\[object Object]/, "1206545314312626226"],
];

export default function addReactionEvents(client: Client): void {
  // Verify that the reactions are consistent
  for (const [regex, emoji] of REACTIONS) {
    // Verify that the emoji exists
    if (!client.emojis.cache.has(emoji)) {
      throw new Error(`Emoji ${emoji} not found`);
    }
    // Verify that the regex is stateless
    if (regex.global) {
      throw new Error(`Regex ${regex} has stateful flags`);
    }
  }

  // Add a reaction to a message if it matches a regex
  client.on("messageCreate", (message) => {
    const messageContent = message.content;
    for (const [regex, emoji] of REACTIONS) {
      if (regex.test(messageContent)) {
        message.react(emoji);
      }
    }
  });
}
