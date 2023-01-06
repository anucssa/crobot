import { Client } from 'discord.js'
import { getTimes, GetTimesResult } from 'suncalc'
import dayIcon from './assets/dayIcon'
import nightIcon from './assets/nightIcon'
import sharp from 'sharp'

export class DayNightIcon {
  private readonly discordClient: Client<true>
  private lastIconValue: number
  constructor (client: Client<true>) {
    this.discordClient = client
    this.lastIconValue = -1
  }

  public async updateIcon (): Promise<void> {
    const day = this.currentDayAmount()
    if (day !== this.lastIconValue) {
      const newIcon = await this.generateIcon(day)
      const cssa = await this.discordClient.guilds.fetch('476382037620555776')
      await cssa.setIcon(newIcon)
      this.lastIconValue = day
      console.log(`Updated server icon at ${Math.round(day * 1000) / 10}% day level`)
    }
    setTimeout(() => { void this.updateIcon() }, 1000 * 60 * 3)
  }

  private currentDayAmount (): number {
    const times = this.getTimes()
    const now = Date.now()
    if (now <= times.dawn.getTime() || now >= times.dusk.getTime()) {
      return 0
    } else if (now >= times.sunriseEnd.getTime() && now <= times.sunsetStart.getTime()) {
      return 1
    } else if (now < times.sunriseEnd.getTime()) {
      const sunriseDuration = times.sunriseEnd.getTime() - times.dawn.getTime()
      const sunriseElapsed = now - times.dawn.getTime()
      return sunriseDuration / sunriseElapsed
    } else {
      const sunsetDuration = times.dusk.getTime() - times.sunsetStart.getTime()
      const sunsetElapsed = now - times.sunsetStart.getTime()
      return 1 - (sunsetDuration / sunsetElapsed)
    }
  }

  private getTimes (date = new Date()): GetTimesResult {
    return getTimes(
      date,
      -35.275283,
      149.120506,
      570.8
    )
  }

  private async generateIcon (dayAmount: number): Promise<Buffer> {
    if (dayAmount <= 0) {
      const buf = Buffer.from(nightIcon, 'base64')
      return await sharp(buf).toBuffer()
    } else if (dayAmount >= 1) {
      const buf = Buffer.from(dayIcon, 'base64')
      return await sharp(buf).toBuffer()
    } else {
      const nightBuf = Buffer.from(nightIcon, 'base64')
      const dayBuf = Buffer.from(dayIcon, 'base64')
      return await sharp(nightBuf).ensureAlpha(1).composite([{
        input: await sharp(dayBuf).ensureAlpha(dayAmount).toBuffer()
      }]).toBuffer()
    }
  }
}