import type MembershipStore from './membership-store'
import twilio, { type Twilio } from 'twilio'
import { type VerificationInstance } from 'twilio/lib/rest/verify/v2/service/verification'
import { type VerificationCheckInstance } from 'twilio/lib/rest/verify/v2/service/verificationCheck'
import { type PhoneNumberInstance } from 'twilio/lib/rest/lookups/v2/phoneNumber'
import {
  ActionRowBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js'
import InteractionHandler from '../interaction-handler'

export default class PhoneVerificationManager {
  private readonly membershipStore: MembershipStore
  private readonly twilioClient: Twilio
  constructor (membershipStore: MembershipStore) {
    this.membershipStore = membershipStore
    if (process.env.TWILIO_SID === undefined) throw new Error('TWILIO_SID not set')
    if (process.env.TWILIO_TOKEN === undefined) throw new Error('TWILIO_TOKEN not set')
    if (process.env.TWILIO_VERIFY_SID === undefined) throw new Error('TWILIO_VERIFY_SID not set')
    this.twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
  }

  public async requestPhoneVerificationCode (phoneNumber: string): Promise<VerificationInstance> {
    return await this.twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SID ?? '').verifications.create({
      to: phoneNumber,
      channel: 'sms',
      locale: 'en'
    })
  }

  public async verifyPhoneVerificationCode (phoneNumber: string, code: string): Promise<VerificationCheckInstance> {
    return await this.twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SID ?? '').verificationChecks.create({
      to: phoneNumber,
      code
    })
  }

  public async checkPhoneNumber (phoneNumber: string, countryCode: number): Promise<PhoneNumberInstance> {
    return await this.twilioClient.lookups.v2.phoneNumbers(`+${countryCode}${phoneNumber}`).fetch()
  }

  /**
   * Show phone verification interface in discord
   * @param {ChatInputCommandInteraction<'cached'>} interaction - The discord interaction to use
   * @return {Promise<boolean>} - Whether the verification was successful
   */
  public async handleVerificationInteraction (interaction: ChatInputCommandInteraction<'cached'>): Promise<boolean> {
    try {
      const interactionHandler = new InteractionHandler(interaction)

      if (interactionHandler.member.roles.cache.has('753524901708693558')) {
        await interactionHandler.showReply('You\'re already verified! 🎉\n(Lots of love from the CSSA team for that, you\'re officially awesome 😎)')
        return true
      }

      const verifyNewNumber = async (): Promise<void> => {
        const phoneNumber = await this.handleGetPhoneNumberInteraction(interactionHandler)
        const verification = await this.requestPhoneVerificationCode(phoneNumber)
        await this.handleGetVerificationCodeInteraction(interactionHandler, verification)
      }

      const checkMembership = async (): Promise<void> => {
        const memberPhone = await this.membershipStore.checkPhoneVerificationCache(interactionHandler.user.id)
        if (memberPhone === undefined) {
          throw new Error('No phone number found, this shouldn\'t happen')
        }
        const existingMembership = await this.membershipStore.getMemberPhone(memberPhone)
        if (existingMembership === undefined) {
          await interactionHandler.showReply(`Hmm... We couldn't find your phone number registered to an account on QPay. Check you have an active ${new Date().getFullYear()} membership or sign up at https://anucssa.getqpay.com/ . If you think this is a mistake, please ping <@&476384584041365505>.`)
          throw new Error('No membership found')
        }
        await interactionHandler.member.roles.add('753524901708693558')
        await interactionHandler.showReply(`Thanks for signing up to be a ${new Date().getFullYear()} CSSA Member!
You should have the <@&753524901708693558> role now.
If you have any questions, please ping <@&476384584041365505>.`)
      }

      const previousVerification = await this.membershipStore.checkPhoneVerificationCache(interactionHandler.user.id)
      if (previousVerification === undefined) {
        await verifyNewNumber()
        await checkMembership()
      } else {
        await interactionHandler.showReplyWithActionRow(
            `You have previously verified ownership of ${previousVerification}. Would you like to use it?`,
            [
              {
                label: 'Use Saved Number',
                style: ButtonStyle.Primary,
                callback: async () => {
                  await checkMembership()
                }
              },
              {
                label: 'Verify New Number',
                style: ButtonStyle.Secondary,
                callback: async () => {
                  await verifyNewNumber()
                  await checkMembership()
                }
              }
            ])
      }
      return true
    } catch (error) {
      console.warn(error)
      return false
    }
  }

  /**
   * Show phone number input interface in discord
   * @param {InteractionHandler} interactionHandler - The discord interaction handler to use
   * @private
   * @return {Promise<string>} - The phone number
   * @throws {Error} - If the user doesn't enter a valid phone number, replies with an error message in discord
   */
  private async handleGetPhoneNumberInteraction (interactionHandler: InteractionHandler): Promise<string> {
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

    const modalFields = await interactionHandler.showModal(modal)

    let countryCode = modalFields.getTextInputValue('countrycode')
    const phoneNumber = modalFields.getTextInputValue('phonenumber')
    if (countryCode.startsWith('+')) countryCode = countryCode.slice(1)
    let validatedPhoneNumber
    try {
      validatedPhoneNumber = await this.checkPhoneNumber(phoneNumber, Number.parseInt(countryCode))
    } catch (error) {
      console.log(error)
      await interactionHandler.showReply('An error occurred while validating your phone number. Please try again and make sure you enter your number and country code as shown in the examples.')
      throw new Error('Invalid phone number')
    }
    if (!validatedPhoneNumber.valid) {
      await interactionHandler.showReply(`Hmm... looks like there's an issue with your phone number 😐
We had a look and found the following issues:
${validatedPhoneNumber.validationErrors.map((error) => `- ${error}`).join('\n')}`)
      throw new Error('Invalid phone number')
    }
    await interactionHandler.showReply('Thanks! We\'ll send you a verification code shortly.')
    return validatedPhoneNumber.phoneNumber
  }

  /**
   * Show verification code input interface in discord
   * @param {InteractionHandler} interactionHandler - The discord interaction handler to use
   * @param {VerificationInstance} verification - The verification instance to use for the verification code
   * @private
   * @return {Promise<void>} - Resolves when the user has entered a valid verification code
   * @throws {Error} - If the user doesn't enter a valid verification code, replies with an error message in discord
   */
  private async handleGetVerificationCodeInteraction (interactionHandler: InteractionHandler, verification: VerificationInstance): Promise<void> {
    await interactionHandler.showReplyWithActionRow(
        `Thanks! We've sent you a verification ${verification.channel}. Click the button below once you have the code.`,
        [
          {
            label: 'Enter Code',
            callback: async () => {
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

              const fields = await interactionHandler.showModal(enterCodeModal)

              const code = fields.getTextInputValue('code')
              if (!/^\d{6}$/.test(code)) {
                await interactionHandler.showReply('Hmm... that doesn\'t look like a valid code 🤔')
                throw new Error('Invalid code')
              }
              const verificationCheckInstance = await this.verifyPhoneVerificationCode(verification.to, code)
              if (!verificationCheckInstance.valid) {
                await interactionHandler.showReply('Hmm... looks like there\'s an issue with your verification code 😭')
                throw new Error('Invalid code')
              }
              await this.membershipStore.savePhoneVerificationResult(verification.to, interactionHandler.user.id)
              await interactionHandler.showReply('Thanks! Your phone number has been verified.')
            }
          }
        ],
        120_000
    )
  }
}
