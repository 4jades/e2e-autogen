import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

type ConfigInitializerContract = {
  initialize(): Promise<void>;
};

class ConfigInitializer implements ConfigInitializerContract {
  readonly #configPath: string;

  constructor(configPath: string = "e2e-autogen.config.ts") {
    this.#configPath = resolve(configPath);
  }

  async initialize(): Promise<void> {
    if (this.#fileExists()) {
      throw new Error(`설정 파일이 이미 존재합니다: ${this.#configPath}`);
    }

    await this.#createConfigFile();
    this.#showSuccessMessage();
  }

  #fileExists(): boolean {
    return existsSync(this.#configPath);
  }

  async #createConfigFile(): Promise<void> {
    const configTemplate = this.#getConfigTemplate();
    writeFileSync(this.#configPath, configTemplate, "utf-8");
  }

  #getConfigTemplate(): string {
    return `import { defineConfig } from "@dhlab/e2e-autogen";

export default defineConfig({
  sheetsUrl: "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit",
  framework: "playwright", // 또는 "detox"
  stubOutputFolder: "./tests/e2e",
  jsonReporterFile: "./test-results.json",
  credentialsFile: "./credentials.json",
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

  #showSuccessMessage(): void {
    console.log(`
✅ e2e-autogen.config.ts 파일이 성공적으로 생성되었습니다!

📋 다음 단계:
1. 설정 파일을 열어서 Google Sheets URL을 입력하세요
2. credentials.json 파일을 생성하고 Google API 인증 정보를 설정하세요
3. 'e2e-autogen generate' 명령어로 테스트 스텁을 생성하세요

📚 자세한 설정 방법: https://github.com/dhlab-org/e2e-autogen
    `);
  }
}

export { ConfigInitializer };
