import express, { type Express } from 'express'
import { type Client, type VoiceBasedChannel, type VoiceChannel } from 'discord.js'

const TEN_MINUTES = 1000 * 60 * 10

export class DoorServer {
  private readonly app: Express
  private readonly port: number = 8080
  private timer?: NodeJS.Timeout = undefined
  private readonly discordClient: Client<true>
  private statusChannel: VoiceBasedChannel | undefined

  constructor (discordClient: Client) {
    this.discordClient = discordClient
    this.app = express()
  }

  public async startServer (): Promise<void> {
    if (!this.discordClient.isReady()) throw new Error('Door Status Server initialised before discord client ready.')

    const cssa = await this.discordClient.guilds.fetch('476382037620555776')
    const statusChannel = await cssa.channels.fetch('1060799214550007849') ?? undefined
    if (statusChannel?.isVoiceBased() === true) {
      this.statusChannel = statusChannel as VoiceChannel
    }
    if (this.statusChannel === undefined) throw new Error('Could not find status channel')

    this.discordClient.user?.setPresence({
      activities: [{
        name: 'the door sensor boot',
        type: 3
      }],
      status: 'idle'
    })
    await this.statusChannel?.setName('CR is loading...')

    this.app.use(express.urlencoded({ extended: true }))

    this.app.post('/commonRoom/status', (request, response) => { this.updateCommonRoomStatus(request, response) })

    // Make all other http requests go to qpay
    this.app.get('*', function (request, response) {
      response.redirect('https://webapp.getqpay.com/')
    })

    this.app.listen(this.port, () => {
      console.log(`CROBot listening on ${this.port}`)
    })

    this.timer = setTimeout(() => { this.timeout() }, TEN_MINUTES)
  }

  private updateCommonRoomStatus (request: Parameters<Parameters<typeof this.app.post>[1]>[0], response: Parameters<Parameters<typeof this.app.post>[1]>[1]): void {
    if (this.discordClient === undefined) throw new Error('Discord Client not set')
    console.debug(JSON.stringify(request.body))
    if (request.body.code === process.env.STATUS_PWD) {
      if (request.body.state === '1') {
        this.discordClient.user.setPresence({
          activities: [{
            name: 'room is Open ✨',
            type: 3
          }],
          status: 'online'
        })
        void this.statusChannel?.setName('CR is open!')
      } else {
        this.discordClient.user.setPresence({
          activities: [{
            name: 'room is Closed',
            type: 3
          }],
          status: 'dnd'
        })
        void this.statusChannel?.setName('CR is closed')
      }

      // Reset timer
      if (this.timer !== null) clearTimeout(this.timer)
      this.timer = setTimeout(() => { this.timeout() }, TEN_MINUTES)
      response.end(request.body.status)
    } else {
      response.end('Invalid code')
    }
  }

  private timeout (): void {
    if (this.discordClient === undefined) throw new Error('Discord Client not set')
    this.discordClient.user.setPresence({
      activities: [{
        name: 'sensor dead poke #general',
        type: 3
      }],
      status: 'idle'
    })
    void this.statusChannel?.setName('CR is missing :|')
    this.timer = undefined
  }
}
