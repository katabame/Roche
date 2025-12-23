import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { CommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("echo")
    .setDescription("コマンドを実行したユーザーのメッセージを返すコマンド")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("返すメッセージ")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: CommandInteraction) {
    // 管理者権限のチェック
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: "このコマンドは管理者のみが実行できます。",
        ephemeral: true
      });
      return;
    }

    const message = interaction.options.get("message")?.value as string;

    // チャンネルに直接メッセージを送信
    if (interaction.channel && 'send' in interaction.channel) {
      await (interaction.channel as { send: (content: string) => Promise<unknown> }).send(message);
    }

    // コマンド実行完了の確認メッセージ（ephemeral）
    await interaction.reply({
      content: "メッセージを送信しました。\n```" + message + "```",
      ephemeral: true
    });
  },
};
