import MembershipStore from './membershipStore'
import twilio, { Twilio } from 'twilio'
import { VerificationInstance } from 'twilio/lib/rest/verify/v2/service/verification'
import { VerificationCheckInstance } from 'twilio/lib/rest/verify/v2/service/verificationCheck'
import {
  ActionRowBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js'
import InteractionHandler from '../InteractionHandler'

export default class EmailVerificationManager {
  private readonly membershipStore: MembershipStore
  private readonly twilioClient: Twilio
  constructor (membershipStore: MembershipStore) {
    this.membershipStore = membershipStore
    if (process.env.TWILIO_SID === undefined) throw new Error('TWILIO_SID not set')
    if (process.env.TWILIO_TOKEN === undefined) throw new Error('TWILIO_TOKEN not set')
    if (process.env.TWILIO_VERIFY_SID === undefined) throw new Error('TWILIO_VERIFY_SID not set')
    this.twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
  }

  public async requestEmailVerificationCode (email: string): Promise<VerificationInstance> {
    return await this.twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SID ?? '').verifications.create({
      to: email,
      channel: 'email',
      locale: 'en'
    })
  }

  public async verifyEmailVerificationCode (email: string, code: string): Promise<VerificationCheckInstance> {
    return await this.twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SID ?? '').verificationChecks.create({
      to: email,
      code
    })
  }

  public checkEmail (email: string): boolean {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)
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

      const verifyNewEmail = async (): Promise<void> => {
        const email = await this.handleGetEmailInteraction(interactionHandler)
        const verification = await this.requestEmailVerificationCode(email)
        await this.handleGetVerificationCodeInteraction(interactionHandler, verification)
      }

      const checkMembership = async (): Promise<void> => {
        const memberEmail = await this.membershipStore.checkEmailVerificationCache(interactionHandler.user.id)
        if (memberEmail === undefined) {
          throw new Error('No email found, this shouldn\'t happen')
        }
        const existingMembership = await this.membershipStore.getMemberEmail(memberEmail)
        if (existingMembership === undefined) {
          await interactionHandler.showReply(`Hmm... We couldn't find your email registered to an account on QPay. Check you have an active ${new Date().getFullYear()} membership or sign up at https://anucssa.getqpay.com/ . If you think this is a mistake, please ping <@&476384584041365505>.`)
          throw new Error('No membership found')
        }
        await interactionHandler.member.roles.add('753524901708693558')
        await interactionHandler.showReply(`Thanks for signing up to be a ${new Date().getFullYear()} CSSA Member!
You should have the <@&753524901708693558> role now.
If you have any questions, please ping <@&476384584041365505>.`)
      }

      const previousVerification = await this.membershipStore.checkEmailVerificationCache(interactionHandler.user.id)
      if (previousVerification !== undefined) {
        await interactionHandler.showReplyWithActionRow(
            `You have previously verified ownership of ${previousVerification}. Would you like to use it?`,
            [
              {
                label: 'Use Saved Email',
                style: ButtonStyle.Primary,
                callback: async () => {
                  await checkMembership()
                }
              },
              {
                label: 'Verify New Email',
                style: ButtonStyle.Secondary,
                callback: async () => {
                  await verifyNewEmail()
                  await checkMembership()
                }
              }
            ])
      } else {
        await verifyNewEmail()
        await checkMembership()
      }
      return true
    } catch (e) {
      console.warn(e)
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
  private async handleGetEmailInteraction (interactionHandler: InteractionHandler): Promise<string> {
    const modal = new ModalBuilder()
      .setCustomId('getemail')
      .setTitle('Verify QPay Email')

    const emailForm = new TextInputBuilder()
      .setCustomId('email')
      .setPlaceholder('e.g. uXXXXXXX@anu.edu.au')
      .setRequired(true)
      .setLabel('Email')
      .setStyle(TextInputStyle.Short)

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(emailForm)

    modal.addComponents(actionRow)

    const modalFields = await interactionHandler.showModal(modal)

    const email = modalFields.getTextInputValue('email')
    if (!this.checkEmail(email)) {
      await interactionHandler.showReply('Hmm... looks like your email failed to pass our regex 😐')
      throw new Error('Invalid email')
    }
    await interactionHandler.showReply('Thanks! We\'ll send you a verification code shortly.')
    return email
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
              const verificationCheckInstance = await this.verifyEmailVerificationCode(verification.to, code)
              if (!verificationCheckInstance.valid) {
                await interactionHandler.showReply('Hmm... looks like there\'s an issue with your verification code 😭')
                throw new Error('Invalid code')
              }
              await this.membershipStore.saveEmailVerificationResult(verification.to, interactionHandler.user.id)
              await interactionHandler.showReply('Thanks! Your email has been verified.')
            }
          }
        ],
        120_000
    )
  }
}
