#!/usr/bin/env node
const puppeteer = require("puppeteer");
const program = require("commander");
const fs = require("fs");

program
  .version("0.1.0") // keep this is sync with package.json
  .arguments("<task> <url> <output_path>")
  .option("-t, --timeout <value>", "timeout for page load", 30000)
  .option("-w, --width <value>", "width of the browser window", 1500)
  .option("-h, --height <value>", "height of the browser window", 1000)
  .option("-f, --full-page", "use full page or not", true)
  .option("-p, --page-size <value>", "page size for pdf export", "A4")
  .parse(process.argv);

function fetchPage(url, timeout, options, callback) {
  puppeteer
    .launch({ args: [`--window-size=${options.width},${options.height}`] })
    .then((browser) => {
      browser
        .newPage()
        .then((page) => {
          page
            .goto(url, { waitUntil: "networkidle0", timeout: timeout })
            .then(() => {
              callback(page);
              // ideally we need a browser.close() here run after callback
            });
        })
        .catch((e) => reject(e));
    })
    .catch((e) => reject(e));
}

function screenshot(page, output_path, options) {
  page.screenshot({ path: output_path, fullPage: options.fullPage });
}
function content(page, output_path) {
  page.content().then((content) => {
    fs.writeFileSync(output_path, content);
    process.exit(0); // not sure why it is not exiting without this
  });
}
function pdf(page, output_path, options) {
  page
    .pdf({
      path: output_path,
      fullPage: options.fullPage,
      format: options.pageSize,
    })
    .then(() => {
      process.exit(0); // not sure why it is not exiting without this
    });
}

function showHelpAndExit(missing_item) {
  console.error("No " + missing_item + " specified.");
  program.help();
  process.exit(1);
}
if (!program.args[0]) showHelpAndExit("task");
if (!program.args[1]) showHelpAndExit("url");
if (!program.args[2]) showHelpAndExit("output location");

const task = program.args[0];
const url = program.args[1];
const output_path = program.args[2];
const timeout = program.timeout;
const options = {
  pageSize: program.pageSize,
  fullPage: program.fullPage,
  width: program.width,
  height: program.height,
};
switch (task) {
  case "screenshot":
    fetchPage(url, timeout, options, (page) =>
      screenshot(page, output_path, options)
    );
    break;
  case "content":
    fetchPage(url, timeout, options, (page) => content(page, output_path));
    break;
  case "pdf":
    fetchPage(url, timeout, options, (page) => pdf(page, output_path, options));
    break;
  default:
    console.error("Task options are screenshot,content,pdf. Invalid option.");
}
