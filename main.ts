import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from "discord.js";
import * as path from "node:path";
import config from "./config.json" with { type: "json" };
import { registerMemberEvents } from "./plugin/memberEvents.ts";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// コマンドコレクションの初期化
client.commands = new Collection();
const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];

// コマンドファイルの読み込み
const dirname = new URL("./", import.meta.url).pathname;
const commandFolder = path.join(dirname, "command");

for await (const dirEntry of Deno.readDir(commandFolder)) {
  if (dirEntry.isFile) {
    const command = await import(path.join(commandFolder, dirEntry.name));
    if ("data" in command.default && "execute" in command.default) {
      commands.push(command.default.data.toJSON());
      client.commands.set(command.default.data.name, command.default.execute);
      console.log(`コマンド ${dirEntry.name} を登録しました`);
    }
  }
}

// コマンドをDiscord APIに登録
const rest = new REST().setToken(config.token);
async function registerCommands() {
  try {
    console.log("スラッシュコマンドを登録中...");
    await rest.put(
      Routes.applicationGuildCommands(config.client_id, config.guild_id),
      { body: commands },
    );
    console.log("スラッシュコマンドの登録が完了しました");
  } catch (error) {
    console.error("スラッシュコマンドの登録中にエラーが発生しました:", error);
  }
}

// コマンド実行時のハンドリング
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`コマンド ${interaction.commandName} が見つかりません`);
    return;
  }

  try {
    await command(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "コマンドの実行中にエラーが発生しました",
      ephemeral: true,
    });
  }
});

client.once(Events.ClientReady, () => {
  console.log(`${client.user?.tag} としてログインしました`);
  registerCommands();
});

registerMemberEvents(client);

if (import.meta.main) {
  client.login(config.token);
}
