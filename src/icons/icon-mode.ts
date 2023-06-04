import { type Client } from 'discord.js'

export abstract class IconMode {
  protected readonly discordClient: Client<true>
  private timer: NodeJS.Timeout | undefined
  public abstract readonly interval: number | (() => number)

  public get currentInterval (): number {
    return typeof this.interval === 'function' ? this.interval() : this.interval
  }

  protected constructor (client: Client<true>) {
    this.discordClient = client
  }

  public abstract updateIcon (): Promise<void>

  private async updateIconWrapper (): Promise<void> {
    await this.updateIcon()
    this.timer = setTimeout(() => { void this.updateIconWrapper() }, this.currentInterval)
  }

  public start (): void {
    this.updateIconWrapper().catch(console.error)
  }

  public stop (): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
  }
}
