import { SlashCommandBuilder } from "npm:discord.js"
import type { CommandInteraction } from "npm:discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Pingコマンド'),
    async execute(interaction: CommandInteraction) {
        await interaction.reply('Pong! 🏓')
    }
} 
