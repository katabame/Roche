import { SlashCommandBuilder } from "discord.js";
import type {
  ChatInputCommandInteraction,
  SlashCommandStringOption,
} from "discord.js";

const SEPARATORS = /[,，\s]+/;

export default {
  data: new SlashCommandBuilder()
    .setName("choice")
    .setDescription("複数の選択肢からランダムに1つ選びます")
    .addStringOption((option: SlashCommandStringOption) =>
      option
        .setName("options")
        .setDescription("カンマまたは空白区切りで選択肢を入力してください (2個以上)")
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const raw = interaction.options.getString("options", true);
    const choices = raw
      .split(SEPARATORS)
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    if (choices.length < 2) {
      await interaction.reply({
        content: "選択肢は2つ以上指定してください。",
        ephemeral: true,
      });
      return;
    }

    const pick = choices[Math.floor(Math.random() * choices.length)];
    await interaction.reply(`🎯 選ばれたのは: **${pick}**`);
  },
};

