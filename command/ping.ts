import { SlashCommandBuilder } from "discord.js";
import type { CommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Pingコマンド"),
  async execute(interaction: CommandInteraction) {
    const sent = await interaction.reply({
      content: "🏓 Pong!",
      fetchReply: true,
    });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;

    await interaction.editReply(`🏓 Pong! (反応時間: **${latency}ms**)`);
  },
};
