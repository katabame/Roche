import { REST, Routes, Client, GatewayIntentBits, Collection, Events, RESTPostAPIApplicationCommandsJSONBody } from "npm:discord.js"
import * as path from "jsr:@std/path"
import config from "./config.json" with { type: "json" }

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers
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
		if ('data' in command.default && 'execute' in command.default) {
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
		console.log('スラッシュコマンドを登録中...');
		await rest.put(
			Routes.applicationGuildCommands(config.client_id, config.guild_id),
			{ body: commands }
		);
		console.log('スラッシュコマンドの登録が完了しました');
	} catch (error) {
		console.error('スラッシュコマンドの登録中にエラーが発生しました:', error);
	}
}

// コマンド実行時のハンドリング
client.on(Events.InteractionCreate, async interaction => {
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
			content: 'コマンドの実行中にエラーが発生しました', 
			ephemeral: true 
		});
	}
});

client.once(Events.ClientReady, () => {
	console.log(`${client.user?.tag} としてログインしました`);
	registerCommands();
});

client.on(Events.GuildMemberAdd, async (member) => {
	const channel = member.guild.channels.cache.get(config.alert_channel_id);

	if (channel?.isTextBased()) {
		try {
			await channel.send({
				embeds: [{
					color: 0x00ff00, // 緑色
					title: '👋 メンバー参加',
					description: `<@!${member.user.id}> がサーバーに参加しました`,
					thumbnail: {
						url: member.user.displayAvatarURL()
					},
					fields: [
						{
							name: 'ユーザーID',
							value: member.user.id,
							inline: true
						},
						{
							name: 'アカウント作成日',
							value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
							inline: true
						}
					],
					timestamp: new Date().toISOString()
				}]
			});
		} catch (error) {
			console.error('Failed to send message', error);
		}
	}
});

client.on(Events.GuildMemberRemove, async (member) => {
	const channel = member.guild.channels.cache.get(config.alert_channel_id);

	if (channel?.isTextBased()) {
		try {
			await channel.send({
				embeds: [{
					color: 0xff0000, // 赤色
					title: '👋 メンバー退出',
					description: `<@!${member.user.id}> がサーバーを退出しました`,
					thumbnail: {
						url: member.user.displayAvatarURL()
					},
					fields: [
						{
							name: 'ユーザーID',
							value: member.user.id,
							inline: true
						},
						{
							name: '参加期間',
							value: member.joinedAt ? 
								`<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>から` : 
								'不明',
							inline: true
						}
					],
					timestamp: new Date().toISOString()
				}]
			});
		} catch (error) {
			console.error('Failed to send message', error);
		}
	}
});

if (import.meta.main) {
	client.login(config.token);
}
