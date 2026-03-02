import { Events } from "discord.js";
import type { Client, Message } from "discord.js";
import config from "../config.json" with { type: "json" };

/** Ollama /api/chat エンドポイントのレスポンス (non-streaming) */
interface OllamaChatResponse {
    model: string;
    message: {
        role: string;
        content: string;
    };
    done: boolean;
}

/** ユーザーごとの会話履歴を保持するマップ */
const conversationHistory = new Map<
    string,
    { role: "user" | "assistant"; content: string }[]
>();

/** 会話履歴の最大保持ターン数 (ユーザー+アシスタントで1ターン) */
const MAX_HISTORY_TURNS = 10;

/** !ai プレフィックスなしでも反応するチャンネルID のセット */
const ALWAYS_ON_CHANNELS = new Set<string>([
    "1229630875793227868",
]);

/**
 * Ollama の /api/chat エンドポイントを呼び出す。
 * stream=false で完全なレスポンスを一括取得する。
 */
async function callOllama(
    messages: { role: "user" | "assistant" | "system"; content: string }[],
): Promise<string> {
    const ollamaUrl = (config as Record<string, string>).ollama_url ??
        "http://localhost:11434";
    const ollamaModel = (config as Record<string, string>).ollama_model ??
        "llama3";

    const res = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: ollamaModel,
            messages,
            stream: false,
        }),
    });

    if (!res.ok) {
        throw new Error(`Ollama returned HTTP ${res.status}: ${await res.text()}`);
    }

    const data: OllamaChatResponse = await res.json();
    return data.message.content;
}

/**
 * メッセージイベントを登録する。
 *
 * 動作:
 *   - ボット自身のメッセージは無視する
 *   - メッセージが `!ai ` で始まる場合、Ollama に問い合わせて返答する
 *   - `!ai reset` でその人の会話履歴をリセットする
 */
export function registerOllamaChat(client: Client) {
    client.on(Events.MessageCreate, async (message: Message) => {
        // ボット自身のメッセージは無視
        if (message.author.bot) return;

        const prefix = "!ai";
        const isAlwaysOn = ALWAYS_ON_CHANNELS.has(message.channelId);
        const hasPrefix = message.content.startsWith(prefix);

        // プレフィックスなし & 常時ONチャンネルでもない場合はスキップ
        if (!hasPrefix && !isAlwaysOn) return;

        // プレフィックスありの場合はプレフィックスを除去、なければ全文をbodyとする
        const body = hasPrefix
            ? message.content.slice(prefix.length).trim()
            : message.content.trim();

        // 履歴リセットコマンド (!ai reset のみ)
        if (hasPrefix && body === "reset") {
            conversationHistory.delete(message.author.id);
            await message.reply("会話履歴をリセットしました。");
            return;
        }

        if (!body) {
            await message.reply(
                "使い方: `!ai <メッセージ>` / 履歴リセット: `!ai reset`",
            );
            return;
        }

        // ユーザーの会話履歴を取得・更新
        const history = conversationHistory.get(message.author.id) ?? [];
        history.push({ role: "user", content: body });

        // 古い履歴を削除 (ターン数制限)
        while (history.length > MAX_HISTORY_TURNS * 2) {
            history.splice(0, 2);
        }

        // 「入力中...」表示
        await message.channel.sendTyping();

        try {
            const systemMessages: {
                role: "user" | "assistant" | "system";
                content: string;
            }[] = [
                    {
                        role: "system",
                        content:
                            "あなたは親切なアシスタントです。日本語で簡潔に回答してください。",
                    },
                ];

            const reply = await callOllama([
                ...systemMessages,
                ...history,
            ]);

            // アシスタントの返答を履歴に追加
            history.push({ role: "assistant", content: reply });
            conversationHistory.set(message.author.id, history);

            // Discord のメッセージ上限 (2000文字) を超える場合は分割して送信
            if (reply.length <= 2000) {
                await message.reply(reply);
            } else {
                const chunks = reply.match(/[\s\S]{1,2000}/g) ?? [];
                for (const chunk of chunks) {
                    await message.channel.send(chunk);
                }
            }
        } catch (error) {
            console.error("[OllamaChat] エラー:", error);
            await message.reply(
                "エラーが発生しました。Ollama が起動しているか確認してください。",
            );
        }
    });
}
