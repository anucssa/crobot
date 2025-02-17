import { ChannelType, Events, GuildMember, MessageReaction, User } from "discord.js"

const reactions = [
  { role: '1340905832065400892', channel: '758584741846319124', message: '1340905282565574729', emoji: '644317764470702100' },
  { role: '1340825385444708372', channel: '758584741846319124', message: '1340905282565574729', emoji: '897776954751741' }
]

export async function attatchNegativeRoles() {
  discordClient.addListener(Events.MessageReactionAdd, async (reaction: MessageReaction, user: User) => {
    const config = reactions.find(react =>
      reaction.emoji.id === react.emoji || reaction.emoji.name === react.emoji
    )

    if (!config) return

    const u = await cssaGuild.members.fetch(user.id)
    u.roles.remove(config.role)
  })

  discordClient.addListener(Events.MessageReactionRemove, async (reaction, user) => {
    const config = reactions.find(react =>
      reaction.emoji.id === react.emoji || reaction.emoji.name === react.emoji
    )

    if (!config) return

    const u = await cssaGuild.members.fetch(user.id)
    u.roles.add(config.role)
  })

  discordClient.addListener(Events.GuildMemberAdd, async (member: GuildMember) => {
    for (const reaction of reactions) {
      member.roles.add(reaction.role)
    }
  })

  const allUsers = await cssaGuild.members.fetch()

  for (const reaction of reactions) {
    const channel = discordClient.channels.resolve(reaction.channel)
    if (!channel || channel.type !== ChannelType.GuildText) continue
    const message = await channel.messages.fetch(reaction.message)

    const reactions = message.reactions.resolve(reaction.emoji)
    const optOutUsers = await reactions?.users.fetch()
    if (!optOutUsers) continue

    for (const [userId, user] of allUsers) {

      if (optOutUsers.some(u => u.id === userId)) {
        if (user.roles.cache.has(reaction.role)) {
          console.log('removing role to', user.user.username)
          await user.roles.remove(reaction.role)
        }
      } else {
        if (!user.roles.cache.has(reaction.role)) {
          console.log('assigning role to', user.user.username)
          await user.roles.add(reaction.role)
        }
      }
    }
  }

}

