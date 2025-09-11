#!/usr/bin/env node

import { loadUserConfig } from "../config";
import { CliApplication } from "./cli-application";

const main = async () => {
  const args = process.argv.slice(2);

  // init 명령어는 설정 파일이 필요하지 않음
  if (args[0] === "init") {
    const app = new CliApplication(args, null);
    await app.run();
    return;
  }

  const config = await loadUserConfig();
  const app = new CliApplication(args, config);
  await app.run();
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
