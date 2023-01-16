import { config } from 'dotenv'
import axios, { AxiosResponse } from 'axios'
import qs from 'qs'
import { LoginData, MembershipListData, SocietyMemberData } from './qpay'

const baseURL = 'https://webapp.getqpay.com/makecall.php'

export default class QpayClient {
  private sessionId: string | undefined
  constructor () {
    config({ path: process.env.NODE_ENV === 'development' ? './.env' : '/etc/crobot/.env' })
  }

  private get loggedIn (): boolean {
    return this.sessionId !== undefined
  }

  private async makeRequest<T> (data: Record<string, string | number>): Promise<AxiosResponse<T>> {
    return await axios.post<T>(baseURL, qs.stringify(data))
  }

  public async login (): Promise<void> {
    if (this.loggedIn) {
      return
    }

    if (process.env.QPAY_PHONE === undefined) throw new Error('QPAY_PHONE not set')
    if (process.env.QPAY_PASSWORD === undefined) throw new Error('QPAY_PASSWORD not set')

    const res = await this.makeRequest<LoginData>({
      'details[phonenumber]': process.env.QPAY_PHONE,
      'details[passwordhash]': process.env.QPAY_PASSWORD,
      'details[device]': 'web_portal',
      'details[version]': 8,
      endpoint: 'login'
    })

    this.sessionId = res.data.sessionid
    console.log('Logged in to QPay as ' + res.data.email)
  }

  public async getMembers (): Promise<SocietyMemberData[]> {
    if (this.sessionId === undefined) throw new Error('Not logged in')
    if (process.env.QPAY_SOCIETY_ID === undefined) throw new Error('QPAY_SOCIETY_ID not set')

    const res = await this.makeRequest<MembershipListData>({
      'details[sessionid]': this.sessionId,
      'details[device]': 'web_portal',
      'details[version]': 4,
      endpoint: 'getSocietyPortalMembershipList',
      'details[societyID]': process.env.QPAY_SOCIETY_ID
    })

    return res.data.allMemberships
  }
}
