import { SlashCommandBuilder } from "npm:discord.js"
import type { CommandInteraction } from "npm:discord.js"

export default {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Pingコマンド'),
	async execute(interaction: CommandInteraction) {
		const sent = await interaction.reply({ content: 'Pong! 🏓', fetchReply: true })
		const latency = sent.createdTimestamp - interaction.createdTimestamp

		await interaction.editReply(`Pong! 🏓\n反応時間: **${latency}ms**`)
	}
} 
