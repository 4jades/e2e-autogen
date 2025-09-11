import { match } from "ts-pattern";
import { ConfigInitializer, type TE2EAutogenConfig } from "../../config";
import { authorizedGoogleSpreadsheets } from "../google-spreadsheets";
import { TestCoverage } from "../test-coverage";
import { TestRegistry } from "../test-registry";
import { TestScribe } from "../test-scribe";
import { Command, type CommandContract } from "./command";

type CliApplicationContract = {
  run(): Promise<void>;
};

class CliApplication implements CliApplicationContract {
  readonly #command: CommandContract;

  constructor(args: string[], config: TE2EAutogenConfig | null) {
    this.#command = new Command(args, config);
  }

  async run(): Promise<void> {
    try {
      match(this.#command)
        .with({ type: "FLAG", flag: "HELP" }, () => {
          this.#showUsage();
          process.exit(0);
        })
        .with({ type: "FLAG", flag: "VERSION" }, () => {
          this.#showVersion();
          process.exit(0);
        })
        .with({ type: "SUB_COMMAND", subCommand: "GENERATE" }, async () => {
          await this.#generateStub();
        })
        .with({ type: "SUB_COMMAND", subCommand: "UPDATE" }, async () => {
          await this.#logResults();
        })
        .with({ type: "SUB_COMMAND", subCommand: "INIT" }, async () => {
          await this.#initConfig();
        })
        .exhaustive();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }

  #showUsage(): void {
    console.log(`
┌─────────────────────────────────────────────────────────────────┐
│                         E2E AutoGen                            │
│                Google Sheets 기반 E2E 테스트 자동화            │
└─────────────────────────────────────────────────────────────────┘

📋 사용법:
  e2e-autogen [명령어] [옵션]

🚀 명령어:
  init        e2e-autogen.config.ts 설정 파일 생성
  generate    Google Sheets에서 스텁 코드 생성
  update      테스트 결과를 Google Sheets에 업데이트

🔧 옵션:
  -h, --help     도움말 표시
  -v, --version  버전 정보 표시

📋 설정 파일:
  프로젝트 루트에 'e2e-autogen.config.ts' 파일이 필요합니다.

💡 사용 예시:
  # 설정 파일 생성
  e2e-autogen init

  # 스텁 코드 생성
  e2e-autogen generate

  # 테스트 결과 업데이트  
  e2e-autogen update

📚 자세한 문서: https://github.com/dhlab-org/e2e-autogen
    `);
  }

  #showVersion(): void {
    // TODO: rollup 수정 후 버전 표시 추가
    console.log(`e2e-autogen vtest`);
  }

  async #generateStub() {
    const {
      sheetsUrl,
      credentialsFile,
      stubOutputFolder,
      framework,
      googleSheetColumns,
    } = this.#command.optionsOf("GENERATE");

    const googleSpreadsheets = await authorizedGoogleSpreadsheets(
      sheetsUrl,
      credentialsFile,
      googleSheetColumns
    );

    const testScribe = new TestScribe(googleSpreadsheets, stubOutputFolder);
    await testScribe.generateStubFor(framework);
  }

  async #logResults() {
    const { sheetsUrl, jsonReporterFile, credentialsFile, googleSheetColumns } =
      this.#command.optionsOf("UPDATE");

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

  async #initConfig() {
    const configInitializer = new ConfigInitializer();
    await configInitializer.initialize();
  }
}

export { CliApplication, type CliApplicationContract };
