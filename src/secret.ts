export default function addStageOne(): void {
  const messagedAlready: Set<string> = new Set();

  discordClient.on("messageCreate", (message) => {
    // Spoiler check
    const testingChannel = "975653948394471434";
    const isAprilFools =
      new Date().getMonth() === 3 && new Date().getDate() === 1;
    if (message.channel.id !== testingChannel && !isAprilFools) return;

    const messageContent = message.content;
    // Check if the message contains "april" and "fool" in any order and case
    if (
      messageContent.toLowerCase().includes("april") &&
      messageContent.toLowerCase().includes("fool")
    ) {
      // Reply to the message privately
      const replyChunks = [
        "aHR0cHM6Ly9",
        "jc3NhLmNsdW",
        "IveW91cnF1Z",
        "XN0c3RhcnRz",
        "aGVyZQ==",
      ];

      const userId = message.author.id;
      const finalDigit = userId.at(-1);
      if (finalDigit === undefined) {
        return;
      }
      const chunkIndex = Number.parseInt(finalDigit, 10) % replyChunks.length;
      const replyText = replyChunks[chunkIndex];

      void message.react("644317766496813056");

      if (messagedAlready.has(userId)) return;

      void message.author.send(`Chunk = \`${replyText}\``);

      messagedAlready.add(userId);
    }
  });
}
