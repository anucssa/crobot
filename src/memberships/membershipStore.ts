import QpayClient from './qpayClient'
import storage, { LocalStorage } from 'node-persist'
import { SocietyMemberData } from './qpay'
import twilio, { Twilio } from 'twilio'
import { config } from 'dotenv'

export default class MembershipStore {
  private readonly qpayClient: QpayClient
  private readonly twilioClient: Twilio
  private members: SocietyMemberData[] = []
  private membersLastUpdated: Date | undefined

  private readonly verificationStore: LocalStorage = storage.create({ dir: process.env.NODE_ENV === 'development' ? './data/verificationStore' : '/usr/local/libexec/crobot/data/verificationStore' })

  constructor () {
    config({ path: process.env.NODE_ENV === 'development' ? './.env' : '/etc/crobot/.env' })
    if (process.env.TWILIO_SID === undefined) throw new Error('TWILIO_SID not set')
    if (process.env.TWILIO_TOKEN === undefined) throw new Error('TWILIO_TOKEN not set')
    this.qpayClient = new QpayClient()
    this.twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
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
      return this.members.find(m => m.phonenumber === phone)
    }
    return member
  }
}
