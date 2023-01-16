import {
  ApplicationCommandType,
  ContextMenuCommandBuilder, EmbedBuilder,
  MessageContextMenuCommandInteraction,
  PermissionsBitField
} from 'discord.js'

export const data = new ContextMenuCommandBuilder()
  .setName('Quote')
  .setDMPermission(false)
  .setType(ApplicationCommandType.Message)
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)

export async function execute (interaction: MessageContextMenuCommandInteraction<'cached'>): Promise<void> {
  const quotesChannel = await interaction.guild.channels.fetch('758557309285826611')
  if (quotesChannel === null) {
    throw new Error('Quotes channel is null')
  } else if (!quotesChannel.isTextBased()) {
    throw new Error('Quotes channel is not text based')
  }
  const quoteTarget = interaction.targetMessage

  if (!quotesChannel.permissionsFor(interaction.member).has(PermissionsBitField.Flags.SendMessages)) {
    await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true })
    return
  }

  await quotesChannel.send({
    embeds: [new EmbedBuilder()
      .setTitle(`Quote of ${quoteTarget?.member?.displayName ?? quoteTarget?.author.username}`)
      .setDescription(quoteTarget?.content)
      .setURL(quoteTarget?.url)
      .setTimestamp(quoteTarget?.createdAt)
      .setColor(quoteTarget?.member?.displayHexColor ?? null)
      .setAuthor({
        name: quoteTarget?.member?.displayName ?? quoteTarget?.author.username,
        iconURL: quoteTarget?.author.avatarURL({ size: 64 }) ?? ''
      })
      .setFields({
        name: 'Quoted in',
        value: `<#${interaction.channel?.id ?? 'Not found'}>`,
        inline: true
      }, {
        name: 'Quoted by',
        value: `<@${interaction.member?.id ?? 'Not found'}>`,
        inline: true
      })
    ]
  })

  await interaction.reply({ content: 'Quote sent to #quotes', ephemeral: true })
}
