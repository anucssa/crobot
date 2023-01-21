import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('verifyphone')
  .setDescription('Link your discord account to a QPay Membership via phone number.')
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
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

  const modal = new ModalBuilder()
    .setCustomId('getphonenumber')
    .setTitle('Verify QPay Phone Number')

  const countryCodeInput = new TextInputBuilder()
    .setCustomId('countrycode')
    .setPlaceholder('e.g. +61')
    .setRequired(true)
    .setLabel('Country Code')
    .setStyle(TextInputStyle.Short)

  const phoneNumberInput = new TextInputBuilder()
    .setCustomId('phonenumber')
    .setPlaceholder('e.g. 412345678')
    .setRequired(true)
    .setLabel('Phone Number')
    .setStyle(TextInputStyle.Short)

  const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(countryCodeInput)
  const actionRow2 = new ActionRowBuilder<TextInputBuilder>().addComponents(phoneNumberInput)

  modal.addComponents(actionRow, actionRow2)

  await interaction.showModal(modal)
  const modalInteraction = await interaction.awaitModalSubmit({
    time: 60_000,
    filter: (filterInteraction) => filterInteraction.user.id === interaction.user.id && filterInteraction.customId === 'getphonenumber' && !filterInteraction.replied
  })

  let countryCode = modalInteraction.fields.getTextInputValue('countrycode')
  const phoneNumber = modalInteraction.fields.getTextInputValue('phonenumber')
  if (countryCode.startsWith('+')) countryCode = countryCode.substring(1)
  let validatedPhoneNumber
  try {
    validatedPhoneNumber = await modalInteraction.client.membershipStore.checkPhoneNumber(phoneNumber, parseInt(countryCode))
  } catch (e) {
    console.log(e)
    await modalInteraction.reply({ content: 'An error occurred while validating your phone number. Please try again and make sure you enter your number and country code as shown in the examples.', ephemeral: true })
    return
  }
  if (!validatedPhoneNumber.valid) {
    await modalInteraction.reply({
      content: `Hmm... looks like there's an issue with your phone number 😐
We had a look and found the following issues:
${validatedPhoneNumber.validationErrors.map((error) => `- ${error}`).join('\n')}`,
      ephemeral: true
    })
    return
  }
  await modalInteraction.deferReply({ ephemeral: true })
  const verification = await modalInteraction.client.membershipStore.requestPhoneVerificationCode(validatedPhoneNumber.phoneNumber)

  const buttonRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(new ButtonBuilder()
      .setCustomId('entercode')
      .setStyle(ButtonStyle.Primary)
      .setLabel('Enter Code'))

  const codeSentReply = await modalInteraction.editReply({
    content: `Thanks! We've sent you a verification ${verification.channel}. Click the button below once you have the code.`,
    components: [buttonRow]
  })
  const codeSentButtonInteraction = await codeSentReply.awaitMessageComponent({
    time: 120_000,
    filter: (filterInteraction) => filterInteraction.user.id === interaction.user.id && filterInteraction.customId === 'entercode' && !filterInteraction.replied
  })

  const enterCodeModal = new ModalBuilder()
    .setTitle('Enter Verification Code')
    .setCustomId('entercode')

  const enterCodeInput = new TextInputBuilder()
    .setLabel('Verification Code')
    .setCustomId('code')
    .setRequired(true)
    .setPlaceholder('e.g. 123456')
    .setStyle(TextInputStyle.Short)

  const enterCodeActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(enterCodeInput)
  enterCodeModal.addComponents(enterCodeActionRow)

  await codeSentButtonInteraction.showModal(enterCodeModal)
  const enterCodeInteraction = await interaction.awaitModalSubmit({
    time: 60_000,
    filter: (filterInteraction) => filterInteraction.user.id === interaction.user.id && filterInteraction.customId === 'entercode' && !filterInteraction.replied
  })
  const code = enterCodeInteraction.fields.getTextInputValue('code')
  await enterCodeInteraction.deferReply({ ephemeral: true })
  if (!/^\d{6}$/.test(code)) {
    await modalInteraction.deleteReply(codeSentReply)
    await enterCodeInteraction.editReply({
      content: 'Hmm... that doesn\'t look like a valid code 🤔'
    })
    return
  }
  const verificationCheckInstance = await enterCodeInteraction.client.membershipStore.verifyPhoneVerificationCode(validatedPhoneNumber.phoneNumber, code)
  if (!verificationCheckInstance.valid) {
    await modalInteraction.deleteReply(codeSentReply)
    await enterCodeInteraction.editReply({
      content: 'Hmm... looks like there\'s an issue with your verification code 😭'
    })
    return
  }
  // Save phone number here
  await modalInteraction.deleteReply(codeSentReply)
  await enterCodeInteraction.editReply({
    content: 'Thanks! Your phone number has been verified.'
  })
}
