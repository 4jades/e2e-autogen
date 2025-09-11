import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as prompts from "@clack/prompts";

import { BaseCommand } from "./base-command";

/**
 * e2e-autogen.config.ts 설정 파일을 생성하는 명령어를 수행한다.
 */
class InitCommand extends BaseCommand {
  readonly #configPath: string;

  constructor(configPath: string = "e2e-autogen.config.ts") {
    super();
    this.#configPath = resolve(configPath);
  }

  async execute(): Promise<void> {
    if (this.#fileExists()) {
      throw new Error(`설정 파일이 이미 존재합니다: ${this.#configPath}`);
    }

    const config = await this.#userInputCollection();
    await this.#createConfigFile(config);
    this.#showSuccessMessage();
  }

  #fileExists(): boolean {
    return existsSync(this.#configPath);
  }

  async #createConfigFile(config: TUserConfig): Promise<void> {
    const configTemplate = this.#getConfigTemplate(config);
    writeFileSync(this.#configPath, configTemplate, "utf-8");
  }

  async #userInputCollection(): Promise<TUserConfig> {
    prompts.intro("🚀 e2e-autogen 설정을 시작합니다!");

    const cancel = () => {
      prompts.cancel("설정이 취소되었습니다.");
      process.exit(0);
    };

    const sheetsUrl = await prompts.text({
      message: "📊 Google Sheets URL을 입력하세요:",
      validate: (value: string) => {
        if (!value || value.length === 0) {
          return "URL을 입력해주세요";
        }
        return undefined;
      },
    });

    if (prompts.isCancel(sheetsUrl)) cancel();

    const framework = await prompts.select({
      message: "🧪 테스트 프레임워크를 선택하세요:",
      options: [
        { label: "Playwright", value: "playwright" },
        { label: "Detox", value: "detox" },
      ],
    });

    if (prompts.isCancel(framework)) cancel();

    const stubOutputFolder = await prompts.text({
      message: "📁 스텁 파일 출력 폴더:",
      defaultValue: "./playwright/__generated-stub__",
      placeholder: "./playwright/__generated-stub__",
    });

    if (prompts.isCancel(stubOutputFolder)) cancel();

    const jsonReporterFile = await prompts.text({
      message: "📄 테스트 결과 JSON 파일 경로:",
      defaultValue: "./playwright/e2e-autogen-reporter.json",
      placeholder: "./playwright/e2e-autogen-reporter.json",
    });

    if (prompts.isCancel(jsonReporterFile)) cancel();

    const credentialsFile = await prompts.text({
      message: "🔐 Google API 인증 파일 경로:",
      defaultValue: "./playwright/.auth/credentials.json",
      placeholder: "./playwright/.auth/credentials.json",
    });

    if (prompts.isCancel(credentialsFile)) cancel();

    // URL에서 줄바꿈과 공백 제거
    const cleanSheetsUrl = this.#ensureString(sheetsUrl)
      .replace(/\s+/g, "")
      .trim();

    return {
      sheetsUrl: cleanSheetsUrl,
      framework: this.#ensureString(framework) as "playwright" | "detox",
      stubOutputFolder:
        this.#ensureString(stubOutputFolder) ||
        "./playwright/__generated-stub__",
      jsonReporterFile:
        this.#ensureString(jsonReporterFile) ||
        "./playwright/e2e-autogen-reporter.json",
      credentialsFile:
        this.#ensureString(credentialsFile) ||
        "./playwright/.auth/credentials.json",
    };
  }

  #getConfigTemplate(config: TUserConfig): string {
    return `import { defineConfig } from "@dhlab/e2e-autogen";

export default defineConfig({
  sheetsUrl: "${config.sheetsUrl}",
  framework: "${config.framework}",
  stubOutputFolder: "${config.stubOutputFolder}",
  jsonReporterFile: "${config.jsonReporterFile}",
  credentialsFile: "${config.credentialsFile}",
  googleSheetColumns: {
    scenarioId: "A",
    scenarioDescription: "B",
    uiPath: "C",
    action: "D",
    expected: "E",
    testId: "F",
    tag: "G",
    comment: "H"
  }
});
`;
  }

  #ensureString(value: string | symbol): string {
    if (typeof value === "string") {
      return value;
    }
    throw new Error("Expected string value but got symbol");
  }

  #showSuccessMessage(): void {
    prompts.outro(`
✅ e2e-autogen.config.ts 파일이 성공적으로 생성되었습니다!

📋 다음 단계:
1. credentials.json 파일을 생성하고 Google API 인증 정보를 설정하세요
2. Google Sheets의 컬럼 구조가 기본값과 다르다면 설정 파일에서 googleSheetColumns를 수정하세요
3. 'e2e-autogen generate' 명령어로 테스트 스텁을 생성하세요

📚 자세한 설정 방법: https://github.com/dhlab-org/e2e-autogen
    `);
  }
}

export { InitCommand };

type TUserConfig = {
  sheetsUrl: string;
  framework: "playwright" | "detox";
  stubOutputFolder: string;
  jsonReporterFile: string;
  credentialsFile: string;
};
