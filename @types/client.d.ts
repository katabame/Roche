import type { Collection, CommandInteraction } from "discord.js";

type CommandHandler = (interaction: CommandInteraction) => Promise<void>;

declare module "discord.js" {
  interface Client {
    commands: Collection<string, CommandHandler>;
  }
}
