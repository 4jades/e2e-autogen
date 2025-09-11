#!/usr/bin/env node

import { CliApplication } from "./cli-application";

const main = async () => {
  const args = process.argv.slice(2);
  const cli = new CliApplication();

  await cli.run(args);
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
