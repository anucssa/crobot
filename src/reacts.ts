// Do not use the global regex flag, as it will cause the regex to be stateful
// To get the emoji ID, type \:emoji: in discord (make sure to use emojis from the CSSA server,
// or if a unicode emoji, enter the unicode char directly below rather than using the emoji ID)
const REACTIONS: [RegExp, string][] = [
  [/\[object Object]/, "1206545314312626226"],
  [/cs{2,3}lay/i, "1125375653605285888"],
  [/sharepoint/i, "1036132153026691082"],
  [/[ls]gtm/i, "962233144789049434"],
  [/cs(?:sa)?ball/i, "1221369746927386624"],
];

export default function addReactionEvents(): void {
  // Verify that the reactions are consistent
  for (const [regex, emoji] of REACTIONS) {
    // Verify that the emoji exists
    if (!discordClient.emojis.cache.has(emoji)) {
      throw new Error(`Emoji ${emoji} not found`);
    }
    // Verify that the regex is stateless
    if (regex.global) {
      throw new Error(`Regex ${regex} has stateful flags`);
    }
  }

  // Add a reaction to a message if it matches a regex
  discordClient.on("messageCreate", (message) => {
    const messageContent = message.content;
    for (const [regex, emoji] of REACTIONS) {
      if (regex.test(messageContent)) {
        message.react(emoji);
      }
    }
  });
}
