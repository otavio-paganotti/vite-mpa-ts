import { dirname, resolve } from 'path';
import { getPackages, msg } from './utils.mjs'
import cac from 'cac';
import { execa } from 'execa';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import prompts from 'prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../');

/**
 * Prompt a user to select a package.
 */
async function selectPackage() {
  const packages = getPackages().map((name) => name);

  packages.unshift('🌎 build all');

  packages.push('🧨 cancel');

  const { selection } = await prompts({
    type: 'select',
    name: 'selection',
    message: 'Which Project do you want to build?',
    choices: packages.map((name) => ({
      title: name,
      value: name,
    })),
  });

  buildPackage(selection);
}

/**
 * Build the selected package.
 * @param p package name
 * @returns
 */
async function buildPackage(p) {
  const packages = getPackages();

  if (!p) return selectPackage();

  if (p.includes('cancel')) {
    msg.error('The build was cancelled. 👋');
    return;
  }

  if (p.includes('build all') || p === 'all') {
    msg.info('» Building all packages...');

    buildAllPackages(packages);

    return;
  }

  if (!packages.includes(p)) {
    msg.error(`${p} is not an valid package name.`);
  }

  msg.info('» bundling packages...');

  buildSpecificPackage(p);
}

/**
 * Loops through all packages and builds them in correct order
 */
async function buildAllPackages(packages) {
  await cleanMainDist();

  msg.info(`» building all packages...`);

  msg.loader.start();

  for (const p of packages) {
    try {
      await execa('yarn', ['--cwd', `${rootDir}/packages/${p}`, 'typecheck']);

      msg.success(`» [${p}] typecheck passed`);
    } catch(e) {
      msg.error(`» [${p}] typecheck failed or this package does not have a typecheck script.`);
      
      msg.headline(e);
    }
  }

  try {
    await execa('yarn', ['--cwd', rootDir, 'build:all']);

    msg.success(`» build passed`);
  } catch(e) {
    msg.error(`» build failed or this package does not have a build script.`);  
    return;
  }

  msg.loader.stop();
}

async function buildSpecificPackage(p) {
  await cleanDist(p);

  msg.info(`» [${p}] building package...`);

  msg.loader.start();

  try {
    await execa('yarn', ['--cwd', `${rootDir}/packages/${p}`, 'build']);

    msg.success(`» [${p}] build passed`);
  } catch(e) {
    msg.error(`» [${p}] build failed or this package does not have a build script.`);  

    return;
  }

  msg.loader.stop();
}

/**
 * Remove the dist directory from root project before building anything.
 */
async function cleanMainDist() {
  msg.info(`» cleaning dist artifact...`);
  const distDir = `${rootDir}/dist`;

  try {
    await fs.access(distDir);
    const files = await fs.readdir(distDir);
    await Promise.all(
      files.map((file) => fs.rm(resolve(distDir, file), { recursive: true }))
    );
    msg.info(`» cleaned dist artifact`);
  } catch {
    msg.info(`» dist is already missing, no need to clean it`);
  }
}

/**
 * Remove the dist directory before building anything.
 */
async function cleanDist(p) {
  msg.info(`Removing: ${p}/dist`);
  
  const distDir = `${rootDir}/${p}/dist`;
  
  try {
    await fs.access(distDir);
    const files = await fs.readdir(distDir);
    await Promise.all(
      files.map((file) => fs.rm(resolve(distDir, file), { recursive: true }))
    );
    msg.info(`» cleaned dist artifacts`);
  } catch {
    msg.info(`» ${p}/dist is already missing, no need to clean it`);
  }
}

/**
 * Setup the command line tool and options.
 */
const cli = cac();

cli.option('--build [build]', 'Name of the project you would like to build', {
  default: false,
  type: [String]
});

cli
  .command('[cli]', 'Generic entrypoint for Monorepo CLI tooling', {
    allowUnknownOptions: true,
  })
  .action((dir, options) => {
    selectPackage(options.script)
  });

cli.help();

cli.parse();
