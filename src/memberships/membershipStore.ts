import QpayClient from './qpayClient'
import storage, { LocalStorage } from 'node-persist'
import { SocietyMemberData } from './qpay'
import { config } from 'dotenv'
import { Snowflake } from 'discord.js'
import PhoneVerificationManager from './phoneVerification'
import EmailVerificationManager from './emailVerification'

export default class MembershipStore {
  private readonly qpayClient: QpayClient
  private members: SocietyMemberData[] = []
  private membersLastUpdated: Date | undefined

  private readonly verificationStore: LocalStorage = storage.create({ dir: './data/verificationStore' })
  public readonly phoneVerificationManager: PhoneVerificationManager
  public readonly emailVerificationManager: EmailVerificationManager

  constructor () {
    config({ path: '.env' })
    this.qpayClient = new QpayClient()
    this.phoneVerificationManager = new PhoneVerificationManager(this)
    this.emailVerificationManager = new EmailVerificationManager(this)
  }

  async init (): Promise<void> {
    await this.verificationStore.init()
    await this.qpayClient.login()
    await this.refreshMembers()
  }

  async refreshMembers (): Promise<void> {
    this.members = await this.qpayClient.getMembers()
    this.membersLastUpdated = new Date()
  }

  async getMemberEmail (email: string): Promise<SocietyMemberData | undefined> {
    const member = this.members.find(m => m.email === email)
    if (member === undefined) {
      await this.refreshMembers()
      return this.members.find(m => m.email === email)
    }
    return member
  }

  async getMemberPhone (phone: string): Promise<SocietyMemberData | undefined> {
    const member = this.members.find(m => m.phonenumber === phone)
    if (member === undefined) {
      await this.refreshMembers()
      // Hacky way of adding a +61 onto australian number as the leading zero is truncated 
      return this.members.find(m => m.phonenumber === phone || "+61" + m.phonenumber.substring(1) === phone )
    }
    return member
  }

  public async savePhoneVerificationResult (phoneNumber: string, discordId: Snowflake): Promise<void> {
    const existing = await this.verificationStore.getItem(discordId) ?? {}
    existing.phone = phoneNumber
    await this.verificationStore.setItem(discordId, existing)
  }

  public async checkPhoneVerificationCache (discordId: Snowflake): Promise<string | undefined> {
    return (await this.verificationStore.getItem(discordId))?.phone
  }

  public async saveEmailVerificationResult (email: string, discordId: Snowflake): Promise<void> {
    const existing = await this.verificationStore.getItem(discordId) ?? {}
    existing.email = email
    await this.verificationStore.setItem(discordId, existing)
  }

  public async checkEmailVerificationCache (discordId: Snowflake): Promise<string | undefined> {
    return (await this.verificationStore.getItem(discordId))?.email
  }
}