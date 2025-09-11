import { match } from "ts-pattern";
import { loadUserConfig } from "../../config";
import { GenerateCommand } from "./generate-command";
import { HelpCommand } from "./help-command";
import { InitCommand } from "./init-command";
import { UpdateCommand } from "./update-command";
import { VersionCommand } from "./version-command";

type TCommandType = "init" | "generate" | "update" | "help" | "version";

type CliApplicationContract = {
  run(args: string[]): Promise<void>;
};

class CliApplication implements CliApplicationContract {
  async run(args: string[]): Promise<void> {
    const commandType = this.#parsedCommandType(args);

    const command = match(commandType)
      .with("init", () => new InitCommand())
      .with("help", () => new HelpCommand())
      .with("version", () => new VersionCommand())
      .with("generate", async () => {
        const config = await loadUserConfig();
        return new GenerateCommand(config);
      })
      .with("update", async () => {
        const config = await loadUserConfig();
        return new UpdateCommand(config);
      })
      .exhaustive();

    const resolvedCommand = await command;
    await resolvedCommand.execute();
  }

  #parsedCommandType(args: string[]): TCommandType {
    return match(args)
      .when(
        (args) =>
          args.length === 0 || args.includes("--help") || args.includes("-h"),
        () => "help" as const
      )
      .when(
        (args) => args.includes("--version") || args.includes("-v"),
        () => "version" as const
      )
      .when(
        (args) => args[0] === "init",
        () => "init" as const
      )
      .when(
        (args) => args[0] === "generate",
        () => "generate" as const
      )
      .when(
        (args) => args[0] === "update",
        () => "update" as const
      )
      .otherwise(() => {
        throw new Error(`알 수 없는 명령어: ${args[0] || "없음"}`);
      });
  }
}

export { CliApplication, type CliApplicationContract };
