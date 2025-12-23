import { SlashCommandBuilder } from "discord.js";
import type {
  ChatInputCommandInteraction,
  SlashCommandIntegerOption,
} from "discord.js";

const DEFAULT_SIDES = 100;
const DEFAULT_COUNT = 1;
const MAX_SIDES = 1000;
const MAX_COUNT = 20;
const DICE_PATTERN = /^(\d{1,3})d(\d{1,4})$/i;

export default {
  data: new SlashCommandBuilder()
    .setName("diceroll")
    .setDescription("ダイスロールを行います")
    .addStringOption((option) =>
      option
        .setName("dice")
        .setDescription("NdM 形式で指定 (例: 2d6). count/sides より優先")
    )
    .addIntegerOption((option: SlashCommandIntegerOption) =>
      option
        .setName("count")
        .setDescription("振るダイスの個数 (1〜20)")
        .setMinValue(1)
        .setMaxValue(MAX_COUNT)
    )
    .addIntegerOption((option: SlashCommandIntegerOption) =>
      option
        .setName("sides")
        .setDescription("ダイスの面数 (2〜1000)")
        .setMinValue(2)
        .setMaxValue(MAX_SIDES)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    // 入力優先順位: dice(文字列) -> count/sides(整数) -> デフォルト
    const diceText = interaction.options.getString("dice") ?? undefined;
    let count = interaction.options.getInteger("count") ?? DEFAULT_COUNT;
    let sides = interaction.options.getInteger("sides") ?? DEFAULT_SIDES;

    if (diceText) {
      const match = diceText.trim().match(DICE_PATTERN);
      if (!match) {
        await interaction.reply({
          content: "NdM 形式で入力してください（例: 2d6）。",
          ephemeral: true,
        });
        return;
      }
      count = Number(match[1]);
      sides = Number(match[2]);
    }

    // 念のためバリデーション (コマンド定義側でも制限済み)
    if (sides < 2 || sides > MAX_SIDES || count < 1 || count > MAX_COUNT) {
      await interaction.reply({
        content: "ダイスの設定値が不正です。",
        ephemeral: true,
      });
      return;
    }

    const rolls = Array.from(
      { length: count },
      () => Math.floor(Math.random() * sides) + 1,
    );
    const total = rolls.reduce((sum, value) => sum + value, 0);
    const isD100 = sides === 100;
    const isCritical = (v: number) => isD100 && v >= 1 && v <= 5;
    const isFumble = (v: number) => isD100 && v >= 96 && v <= 100;
    const criticals = rolls.filter((v) => isCritical(v)).length;
    const fumbles = rolls.filter((v) => isFumble(v)).length;

    const annotated = rolls.map((v) => {
      if (isCritical(v)) return `**${v}🔥**`; // クリティカル
      if (isFumble(v)) return `**${v}💀**`; // ファンブル
      return `${v}`;
    });

    const detail =
      count === 1
        ? `出目: ${annotated[0]}`
        : `出目: ${annotated.join(", ")} / 合計: **${total}**`;

    const outcome =
      criticals || fumbles
        ? ` (クリティカル: ${criticals} / ファンブル: ${fumbles})`
        : "";

    await interaction.reply(`🎲 ${count}d${sides} の結果: ${detail}${outcome}`);
  },
};


