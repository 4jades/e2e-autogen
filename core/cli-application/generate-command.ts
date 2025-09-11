import type { TE2EAutogenConfig } from "../../config";
import { authorizedGoogleSpreadsheets } from "../google-spreadsheets";
import { TestScribe } from "../test-scribe";
import { BaseCommand } from "./base-command";

/**
 * Google Sheets에서 스텁 코드를 생성하는 명령어를 수행한다.
 */
class GenerateCommand extends BaseCommand {
  readonly #config: TE2EAutogenConfig;

  constructor(config: TE2EAutogenConfig) {
    super();
    this.#config = config;
  }

  async execute(): Promise<void> {
    const {
      sheetsUrl,
      credentialsFile,
      stubOutputFolder,
      framework,
      googleSheetColumns,
    } = this.#config;

    const googleSpreadsheets = await authorizedGoogleSpreadsheets(
      sheetsUrl,
      credentialsFile,
      googleSheetColumns
    );

    const testScribe = new TestScribe(googleSpreadsheets, stubOutputFolder);
    await testScribe.generateStubFor(framework);
  }
}

export { GenerateCommand };
