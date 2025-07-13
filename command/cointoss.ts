import { SlashCommandBuilder } from "npm:discord.js"
import type { CommandInteraction } from "npm:discord.js"

export default {
	data: new SlashCommandBuilder()
		.setName('cointoss')
		.setDescription('コイントスを実行します')
		.addStringOption(option =>
			option
				.setName('head')
				.setDescription('表の選択肢を指定してください')
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName('tail')
				.setDescription('裏の選択肢を指定してください')
				.setRequired(true)
		),
	async execute(interaction: CommandInteraction) {
		const head = interaction.options.get('head')?.value as string
		const tail = interaction.options.get('tail')?.value as string
		
		// ランダムにheadまたはtailを選択
		const result = Math.random() < 0.5 ? head : tail
		
		await interaction.reply(`コイントスの結果: **${result}** 🪙`)
	}
}
