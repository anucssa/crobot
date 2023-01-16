import {
  ActionRowBuilder,
  ButtonBuilder,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ButtonStyle, PermissionsBitField
} from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('wipemembers')
  .setDescription('Remove member role from all users in the server, except life members.')
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
  .setDMPermission(false)

export async function execute (interaction: ChatInputCommandInteraction<'cached'>): Promise<void> {
  if (interaction.member === null) {
    throw new Error('Interaction member is null')
  } else if (interaction.channel === null) {
    throw new Error('Interaction channel is null')
  }

  if (interaction.inRawGuild()) {
    throw new Error('Raw guild')
  }

  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    await interaction.reply({ content: 'You do not have permission to use this command. Also you shouldn\'t see this.', ephemeral: true })
    return
  }

  const collector = interaction.channel.createMessageComponentCollector({
    filter: (i) => i.user.id === interaction.user.id,
    time: 15000
  })

  await interaction.reply({
    content: 'Are you sure you want to reset all member roles?',
    components: [new ActionRowBuilder<ButtonBuilder>()
      .addComponents([new ButtonBuilder()
        .setCustomId('confirm')
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Danger)])
    ],
    ephemeral: true
  })

  collector.on('collect', async (i) => {
    if (i.customId === 'confirm') {
      await i.deferUpdate()
      const guild = interaction.guild
      let removed = 0
      await guild.members.fetch()
      await Promise.allSettled(guild.members.cache.map(async (member) => {
        if (member.roles.cache.has('753524901708693558') && !member.roles.cache.has('702889882598506558')) {
          console.log('Removing member role from ' + member.user.username)
          await member.roles.remove('753524901708693558')
          removed += 1
          if (removed % 10 === 0) {
            await interaction.editReply({ content: `Removing members... ${removed} removed so far.` })
          }
        }
      }))
      await interaction.editReply({
        content: `Deleted ${removed} member roles!`,
        components: []
      })
    } else {
      throw new Error('Invalid button ID')
    }
  })
}
