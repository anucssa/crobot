import express, { Express } from 'express'
import { Client } from 'discord.js'

const TEN_MINUTES = 1000 * 60 * 10

export class DoorServer {
  private readonly app: Express
  private readonly port: number = 9000
  private timer: NodeJS.Timeout | null = null
  private discordClient: Client<true> | undefined

  constructor () {
    this.app = express()
  }

  public startServer (discordClient: Client): void {
    this.discordClient = discordClient
    if (!discordClient.isReady()) throw new Error('Door Status Server initialised before discord client ready.')
    this.app.use(express.urlencoded({ extended: true }))

    this.app.post('/commonRoom/status', (req, res) => this.updateCommonRoomStatus(req, res))

    // Make all other http requests go to qpay
    this.app.get('*', function (req, res) {
      res.redirect('https://webapp.getqpay.com/')
    })

    this.app.listen(this.port, () => {
      console.log(`CROBot listening on ${this.port}`)
    })

    this.timer = setTimeout(this.timeout, TEN_MINUTES)
  }

  private updateCommonRoomStatus (req: Parameters<Parameters<typeof this.app.post>[1]>[0], res: Parameters<Parameters<typeof this.app.post>[1]>[1]): void {
    if (this.discordClient === undefined) throw Error('Discord Client not set')
    console.debug(JSON.stringify(req.body))
    if (req.body.code === process.env.STATUS_PWD) {
      if (req.body.state === '1') {
        this.discordClient.user.setPresence({
          activities: [{
            name: 'room is Open ✨',
            type: 3
          }],
          status: 'online'
        })
      } else {
        this.discordClient.user.setPresence({
          activities: [{
            name: 'room is Closed',
            type: 3
          }],
          status: 'dnd'
        })
      }

      // Reset timer
      if (this.timer !== null) clearTimeout(this.timer)
      this.timer = setTimeout(this.timeout, TEN_MINUTES)
      res.end(req.body.status)
    } else {
      res.end('Invalid code')
    }
  }

  private timeout (): void {
    if (this.discordClient === undefined) throw Error('Discord Client not set')
    this.discordClient.user.setPresence({
      activities: [{
        name: 'sensor dead poke #general',
        type: 3
      }],
      status: 'idle'
    })
    this.timer = null
  }
}
