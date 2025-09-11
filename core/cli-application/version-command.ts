import pkg from "../../package.json";
import { BaseCommand } from "./base-command";

/**
 * CLI 버전 정보를 표시하는 명령어를 수행한다.
 */
class VersionCommand extends BaseCommand {
  async execute(): Promise<void> {
    this.#showVersion();
    process.exit(0);
  }

  #showVersion(): void {
    console.log(`e2e-autogen v${pkg.version}`);
  }
}

export { VersionCommand };
