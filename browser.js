require("dotenv").config();
const { Browser } = require("puppeteer");
const puppeteer = require("puppeteer-extra");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const args = [
  "--disable-setuid-sandbox",
  "--no-sandbox",
  "--single-process",
  "--no-zygote",
  "--start-maximized",
];

/**
 * Returns a Puppeteer browser instance.
 *
 * @async
 * @returns {Promise<Browser>} A promise that resolves to a Puppeteer browser instance.
 * @throws {Error} If there are errors launching the browser.
 */
async function getBrowser() {
  const browser = await puppeteer.launch({
    args,
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
    defaultViewport: { height: 768, width: 1366 },
    headless: true,
  });

  return browser;
}

module.exports = { getBrowser };
