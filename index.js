const fetch = require("node-fetch");
const ora = require("ora");
const chalk = require("chalk");

const spinner = ora().start("Checking...");

let fails = 0;

const timeout = (message, time) =>
  new Promise((_, reject) => {
    setTimeout(() => reject(message), time);
  });

const verify = async (section, item, key) => {
  try {
    spinner.start(`Checking ${chalk.green(item.title)}`);
    return await Promise.race([fetch(item[key]), timeout(`Timeout`, 10000)]);
  } catch (e) {
    fails += 1;
    spinner.fail(
      [
        `Section ${section.title} - ${item.title} - ${chalk.red(key)} - (${
          item[key]
        })`,
        `    - ${e}`,
      ].join("\n"),
    );
  }
};

const checkItem = (section) => async (item) => {
  spinner.indent = 2;

  let store = await verify(section, item, "url_store");
  let image = await verify(section, item, "url_image");

  if (store && image) {
    spinner.start();
    spinner.succeed(item.title);
  }
};

const checkSection = async (section) =>
  Promise.all(section.items.map(checkItem(section)));

const main = async (args) => {
  const res = await fetch(args);

  const data = await res.json();

  for (const section of data.sections) {
    await checkSection(section);
  }
  spinner.stop();
  process.exit(fails > 0 ? 1 : 0);
};

process.on("SIGINT", function() {
  process.exit(1);
});

const [, , args] = process.argv;

if (require.main === module) {
  main(args);
} else {
  module.exports = main;
}
