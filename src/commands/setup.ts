import {
  ActionRowBuilder,
  ButtonBuilder,
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
  ButtonStyle
} from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Helps you set up your roles.')
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

  const isCached = interaction.inCachedGuild()

  // Prompt user for pronouns
  const pronouns: Record<string, boolean> = {
    'he/him': false,
    'she/her': false,
    'they/them': false,
    'ask me about my pronouns!': false
  }
  const pronounRoles = Object.keys(pronouns)

  const roleIds: Record<string, string> = {
    'he/him': '758584414413914135',
    'she/her': '758584499645841458',
    'they/them': '758584562287771658',
    'ask me about my pronouns!': '765847290652131359'
  }

  // Get current pronouns
  if (isCached) {
    for (const role of interaction.member.roles.cache) {
      if (pronounRoles.includes(role.name)) {
        pronouns[role.name] = true
      }
    }
  }

  const pronounButtons = (): ButtonBuilder[] => [new ButtonBuilder()
    .setCustomId('he/him')
    .setLabel('He/Him')
    .setStyle(pronouns['he/him'] ? ButtonStyle.Success : ButtonStyle.Danger),
  new ButtonBuilder()
    .setCustomId('she/her')
    .setLabel('She/Her')
    .setStyle(pronouns['she/her'] ? ButtonStyle.Success : ButtonStyle.Danger),
  new ButtonBuilder()
    .setCustomId('they/them')
    .setLabel('They/Them')
    .setStyle(pronouns['they/them'] ? ButtonStyle.Success : ButtonStyle.Danger),
  new ButtonBuilder()
    .setCustomId('ask me about my pronouns!')
    .setLabel('Ask me about my pronouns!')
    .setStyle(pronouns['ask me about my pronouns!'] ? ButtonStyle.Success : ButtonStyle.Danger)]

  const collector = interaction.channel.createMessageComponentCollector({
    filter: (index) => index.user.id === interaction.user.id,
    time: 15_000
  })

  await interaction.reply({
    content: 'Let\'s get started with some pronouns. How should other people refer to you?',
    components: [new ActionRowBuilder<ButtonBuilder>()
      .addComponents(pronounButtons())],
    ephemeral: true
  })

  collector.on('collect', async (index) => {
    if (pronounRoles.includes(index.customId)) {
      await index.deferUpdate()
      if (pronouns[index.customId]) {
        await interaction.member.roles.remove(roleIds[index.customId])
        pronouns[index.customId] = false
      } else {
        await interaction.member.roles.add(roleIds[index.customId])
        pronouns[index.customId] = true
      }
    }
    await interaction.editReply({
      content: 'Let\'s get started with some pronouns. How should other people refer to you?',
      components: [new ActionRowBuilder<ButtonBuilder>()
        .addComponents(pronounButtons())]
    })
  })
}
