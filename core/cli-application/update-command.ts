import type { TE2EAutogenConfig } from "../../config";
import { authorizedGoogleSpreadsheets } from "../google-spreadsheets";
import { TestCoverage } from "../test-coverage";
import { TestRegistry } from "../test-registry";
import { BaseCommand } from "./base-command";

/**
 * 테스트 결과를 Google Sheets에 업데이트하는 명령어를 수행한다.
 */
class UpdateCommand extends BaseCommand {
  readonly #config: TE2EAutogenConfig;

  constructor(config: TE2EAutogenConfig) {
    super();
    this.#config = config;
  }

  async execute(): Promise<void> {
    const { sheetsUrl, jsonReporterFile, credentialsFile, googleSheetColumns } =
      this.#config;

    const googleSpreadsheets = await authorizedGoogleSpreadsheets(
      sheetsUrl,
      credentialsFile,
      googleSheetColumns
    );

    const testRegistry = new TestRegistry(jsonReporterFile, googleSpreadsheets);
    const resultsPerSuite = await testRegistry.resultsPerSuite();
    await testRegistry.logResults(resultsPerSuite);

    const testCoverage = new TestCoverage(resultsPerSuite);
    await testCoverage.update(googleSpreadsheets);
  }
}

export { UpdateCommand };
