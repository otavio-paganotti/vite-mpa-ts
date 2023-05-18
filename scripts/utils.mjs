import fs from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url'
import ora from 'ora';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const packagesDir = resolve(__dirname, '../packages');

export function getPackages() {
  const availablePackages = fs.readdirSync(packagesDir);
  return availablePackages;
};

export const msg = {
  error: (m) => console.log(chalk.bold.red(m)),
  info: (m) => console.log(chalk.cyan(m)),
  success: (m) => console.log(chalk.green(m)),
  label: (m) => console.log(chalk.bold.magenta(m)),
  headline: (m) =>
    console.log(
      chalk.bold.magenta(
        `\n\n${'='.repeat(Math.min(80, m.length))}\n${m}\n${'='.repeat(
          Math.min(80, m.length)
        )}\n`
      )
    ),
  loader: ora(),
};
