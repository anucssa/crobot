import {
  ActionRowBuilder, ButtonBuilder, type ButtonInteraction, ButtonStyle,
  type ChatInputCommandInteraction, type GuildMember,
  type ModalBuilder, type ModalSubmitFields,
  type ModalSubmitInteraction, type User
} from 'discord.js'

export interface ActionDefinition {
  label: string
  style?: ButtonStyle
  callback: () => Promise<void> | void
}

export default class InteractionHandler {
  private interaction: ChatInputCommandInteraction<'cached'> | ModalSubmitInteraction<'cached'> | ButtonInteraction<'cached'>

  constructor (initialInteraction: ChatInputCommandInteraction<'cached'>) {
    this.interaction = initialInteraction
  }

  get user (): User {
    return this.interaction.user
  }

  get member (): GuildMember {
    return this.interaction.member
  }

  public async showModal (modalDefinition: ModalBuilder, time: number = 60_000): Promise<ModalSubmitFields> {
    if (this.interaction.isModalSubmit()) {
      throw new Error('Cannot show modal from modal submit')
    }

    if (modalDefinition.data.custom_id === undefined) {
      modalDefinition.setCustomId(
        (modalDefinition.data.title ?? crypto.randomUUID()).toLowerCase().replaceAll(/[^a-z]/g, '')
      )
    }
    await this.interaction.showModal(modalDefinition)

    const modalInteraction = await this.interaction.awaitModalSubmit({
      time,
      filter: (filterInteraction) => filterInteraction.user.id === this.interaction.user.id && filterInteraction.customId === modalDefinition.data.custom_id && !filterInteraction.replied
    })

    this.interaction = modalInteraction
    return modalInteraction.fields
  }

  public async showReplyWithActionRow (content: string, actions: ActionDefinition[], time: number = 60_000): Promise<void> {
    const actionCallBacks = new Map<string, () => Promise<void> | void>()
    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        actions.map((action): ButtonBuilder => {
          const actionId = action.label.toLowerCase().replaceAll(/[^a-z]/g, '')
          actionCallBacks.set(actionId, action.callback)
          return new ButtonBuilder()
            .setCustomId(actionId)
            .setStyle(action.style ?? ButtonStyle.Primary)
            .setLabel(action.label)
        }))

    const message = await (this.interaction.replied ? this.interaction.editReply({ content, components: [actionRow] }) : this.interaction.reply({ content, components: [actionRow], ephemeral: true }))
    const buttonInteraction = await message.awaitMessageComponent({
      time,
      filter: (filterInteraction) => filterInteraction.user.id === this.interaction.user.id && actionCallBacks.has(filterInteraction.customId) && !filterInteraction.replied
    })
    if (!buttonInteraction.isButton()) {
      throw new Error('Button interaction is not a button interaction')
    }
    const originalInteraction = this.interaction
    this.interaction = buttonInteraction
    try {
      await actionCallBacks.get(buttonInteraction.customId)?.()
      await originalInteraction.deleteReply()
    } catch (error) {
      await originalInteraction.deleteReply()
      throw error
    }
  }

  public async showReply (content: string): Promise<void> {
    await (this.interaction.replied ? this.interaction.editReply({ content }) : this.interaction.reply({ content, ephemeral: true }))
  }
}
