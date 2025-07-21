import config from "../config.json" with { type: "json" };
import { Events } from "npm:discord.js";
import type { Client, GuildMember, PartialGuildMember } from "npm:discord.js";

export function registerMemberEvents(client: Client) {
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    const channel = member.guild.channels.cache.get(config.alert_channel_id);
    if (channel?.isTextBased()) {
      try {
        await channel.send({
          embeds: [{
            color: 0x00ff00, // 緑色
            title: "🛬 メンバー参加",
            description: `<@!${member.user.id}> がサーバーに参加しました`,
            thumbnail: {
              url: member.user.displayAvatarURL(),
            },
            fields: [
              {
                name: "ユーザーID",
                value: member.user.id,
                inline: true,
              },
              {
                name: "ユーザー名",
                value: member.user.username,
                inline: true,
              },
              {
                name: "ユーザー表示名",
                value: member.user.displayName,
                inline: true,
              },
              {
                name: "アカウント作成日",
                value: `<t:${
                  Math.floor(member.user.createdTimestamp / 1000)
                }:R>`,
                inline: true,
              },
            ],
            timestamp: new Date().toISOString(),
          }],
        });
      } catch (error) {
        console.error("Failed to send message", error);
      }
    }
  });

  client.on(
    Events.GuildMemberRemove,
    async (member: GuildMember | PartialGuildMember) => {
      const channel = member.guild.channels.cache.get(config.alert_channel_id);
      if (channel?.isTextBased()) {
        try {
          await channel.send({
            embeds: [{
              color: 0xff0000, // 赤色
              title: "🛫 メンバー退出",
              description: `<@!${member.user.id}> がサーバーを退出しました`,
              thumbnail: {
                url: member.user.displayAvatarURL(),
              },
              fields: [
                {
                  name: "ユーザーID",
                  value: member.user.id,
                  inline: true,
                },
                {
                  name: "ユーザー名",
                  value: member.user.username,
                  inline: true,
                },
                {
                  name: "ユーザー表示名",
                  value: member.user.displayName,
                  inline: true,
                },
                {
                  name: "参加期間",
                  value: member.joinedAt
                    ? `<t:${
                      Math.floor(member.joinedAt.getTime() / 1000)
                    }:R>から`
                    : "不明",
                  inline: true,
                },
              ],
              timestamp: new Date().toISOString(),
            }],
          });
        } catch (error) {
          console.error("Failed to send message", error);
        }
      }
    },
  );
}
