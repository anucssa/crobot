import { IconMode } from './icon-mode'
import type { Client } from 'discord.js'
import { config } from 'dotenv'
import { Octokit } from '@octokit/rest'
import axios from 'axios'
import { Buffer } from 'node:buffer'

export class PrideIcon extends IconMode {
  private readonly recentIcons: string[] = []
  private readonly octokit: Octokit

  public constructor (client: Client<true>) {
    super(client)
    config({ path: '.env' })
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
      timeZone: 'Australia/Sydney'
    })
  }

  public interval: () => number = () => {
    // Get time until next hour
    const now = new Date()
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0)
    return nextHour.getTime() - now.getTime()
  }

  public async updateIcon (): Promise<void> {
    const newIcon = await this.getPrideIcon()
    const cssa = await this.discordClient.guilds.fetch('476382037620555776')
    await cssa.setIcon(newIcon)
  }

  async getPrideIcon (): Promise<Buffer> {
    const repoContents = await this.octokit.rest.repos.getContent({
      owner: 'anucssa',
      repo: 'cssa-pride-icons',
      path: 'icons'
    })
    if (repoContents.status !== 200) {
      throw new Error('Could not get pride icons')
    } else if (!Array.isArray(repoContents.data)) {
      throw new TypeError('GitHub API returned unexpected data')
    }

    let newIcon: Buffer | undefined
    // Get a new icon randomly, but require an extra roll if it's a recent icon
    while (newIcon === undefined) {
      const selectedIcon = repoContents.data[Math.floor(Math.random() * repoContents.data.length)]
      const recentIndex = this.recentIcons.indexOf(selectedIcon.name)
      if (recentIndex !== -1) {
        const requiredChance = 0.9 ** recentIndex
        const roll = Math.random()
        if (roll <= requiredChance) {
          continue
        }
      }
      const downloadUrl = selectedIcon.download_url
      if (downloadUrl === null || downloadUrl === undefined) {
        throw new Error('Could not get icon download url')
      }
      const image = await axios.get(downloadUrl, { responseType: 'arraybuffer' })
      if (image.status !== 200) {
        throw new Error('Could not get icon')
      }
      newIcon = Buffer.from(image.data, 'binary')
      this.recentIcons.unshift(selectedIcon.name)
      if (this.recentIcons.length > 10) {
        this.recentIcons.pop()
      }
    }
    return newIcon
  }
}
