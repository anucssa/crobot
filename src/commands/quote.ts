import {
  ApplicationCommandType,
  Channel,
  ContextMenuCommandBuilder,
  EmbedBuilder,
  Guild,
  GuildMember,
  type MessageContextMenuCommandInteraction,
  User,
} from "discord.js";

export const data = new ContextMenuCommandBuilder()
  .setName("Quote")
  .setDMPermission(false)
  .setType(ApplicationCommandType.Message);

export async function execute(
  interaction: MessageContextMenuCommandInteraction<"cached">,
): Promise<void> {
  const quotesChannel = await interaction.guild.channels.fetch(
    "1169166790094491678",
  );
  if (quotesChannel === null) {
    throw new Error("Quotes channel is null");
  } else if (!quotesChannel.isTextBased()) {
    throw new Error("Quotes channel is not text based");
  }
  const quoteTarget = interaction.targetMessage;

  await sendQuote(interaction.guild, {
    message: quoteTarget.content,
    channel: quoteTarget.channel,
    quotee: quoteTarget.member
      ? [quoteTarget.author, quoteTarget.member]
      : quoteTarget.author.username,
    quoter: interaction.member,
    timestamp: quoteTarget.createdAt,
  });

  await interaction.reply({
    content: "Quote sent to #quotes",
    ephemeral: true,
  });
}

export interface Quote {
  message: string;
  channel?: Channel;
  quotee?: string | [User, GuildMember];
  quoter?: GuildMember;
  url?: string;
  timestamp: Date;
}

export async function sendQuote(guild: Guild, quote: Quote) {
  const quotesChannel = await guild.channels.fetch("1169166790094491678");
  if (quotesChannel === null) {
    throw new Error("Quotes channel is null");
  } else if (!quotesChannel.isTextBased()) {
    throw new Error("Quotes channel is not text based");
  }

  const embed = new EmbedBuilder()
    .setDescription(quote.message)
    .setTimestamp(quote.timestamp);

  if (quote.channel) {
    embed.addFields({
      name: "Quoted in",
      value: `<#${quote.channel?.id ?? "Not found"}>`,
      inline: true,
    });
  }

  if (quote.quoter && quote.quoter.id) {
    embed.addFields({
      name: "Quoted by",
      value: `<@${quote.quoter.id}>`,
      inline: true,
    });
  }

  if (quote.url) {
    embed.setURL(quote.url);
  }

  if (Array.isArray(quote.quotee)) {
    embed.setColor(quote.quotee[1].displayHexColor);
  }

  if (typeof quote.quotee === "string") {
    embed.setTitle(`Quote of ${quote.quotee}`);
    embed.setAuthor({
      name: quote.quotee,
    });
  } else if (Array.isArray(quote.quotee)) {
    const [user, member] = quote.quotee;
    embed.setTitle(`Quote of ${member.displayName ?? user.username}`);
    embed.setAuthor({
      name: member?.displayName ?? user.username,
      iconURL: user.avatarURL({ size: 64 }) ?? "",
    });
  } else {
    embed.setTitle(`Anonymous Quote`);
    embed.setAuthor({
      name: "Anonymous",
    });
  }

  return quotesChannel.send({
    embeds: [embed],
  });
}
