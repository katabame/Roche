import type { Collection } from "npm:discord.js";

declare module "npm:discord.js" {
  interface Client {
    commands: Collection<
      string,
      (interaction: CommandInteraction) => Promise<void>
    >;
  }
}
