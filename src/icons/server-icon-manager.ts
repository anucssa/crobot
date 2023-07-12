// import { DayNightIcon } from './day-night-icon'
import { PrideIcon } from './pride-icon'
import { type Client } from 'discord.js'
import { type IconMode } from './icon-mode'

export default class ServerIconManager {
  // private readonly dayNightIcon: DayNightIcon
  private readonly prideIcon: PrideIcon
  // private lastIcon: IconMode

  constructor (client: Client<true>) {
    // this.dayNightIcon = new DayNightIcon(client)
    this.prideIcon = new PrideIcon(client)
    // this.lastIcon = this.currentIcon
  }

  private get currentIcon (): IconMode {
    // return new Date().getMonth() === 5 ? this.prideIcon : this.dayNightIcon
    return this.prideIcon
  }

  // private get notCurrentIcon (): IconMode {
  //   return new Date().getMonth() === 5 ? this.dayNightIcon : this.prideIcon
  // }
  //
  // private get timeTilNextIcon (): number {
  //   // Get time until next June, or end of June if it's currently June
  //   const now = new Date()
  //   if (now.getMonth() === 5) {
  //     const startOfJuly = new Date(now.getFullYear(), 6, 1, 0, 0, 0)
  //     return startOfJuly.getTime() - now.getTime()
  //   } else {
  //     const nextJune = new Date(now.getMonth() > 5 ? now.getFullYear() + 1 : now.getFullYear(), 5, 1, 0, 0, 0)
  //     return nextJune.getTime() - now.getTime()
  //   }
  // }

  // public async * iconTimer (): AsyncGenerator<void, void, void> {
  //   while (true) {
  //     // JS gets a bit weird with big timeouts, so we cap it at 1 hour and just loop
  //     while (this.currentIcon === this.lastIcon) {
  //       const timeTilNextIcon = this.timeTilNextIcon
  //       await delay(Math.min(timeTilNextIcon, 60 * 60 * 1000))
  //     }
  //     yield
  //   }
  // }

  public async iconLoop (): Promise<void> {
    this.currentIcon.start()
    // this.lastIcon = this.currentIcon
    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // for await (const _ of this.iconTimer()) {
    //   this.notCurrentIcon.stop()
    //   this.currentIcon.start()
    //   this.lastIcon = this.currentIcon
    // }
  }
}

// eslint-disable-next-line @typescript-eslint/promise-function-async -- This is a promise and making it use async/await is stupid
// const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))
