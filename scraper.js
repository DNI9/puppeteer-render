const { Page } = require("puppeteer");
const { getBrowser } = require("./browser");

const BASE_URL = "https://www.myntra.com";

function waitFor(timeout) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
}

function getRatingsAsNumber(text) {
  if (text.endsWith("k")) {
    return Number(text.slice(0, text.length - 1) * 1000);
  }
  return Number(text);
}

/**
 * @param {string} query
 */
function getUrl(query) {
  if (query.startsWith("http")) {
    return encodeURI(query);
  }
  return `${BASE_URL}/${query.replace(" ", "-")}?rawQuery=${encodeURI(
    query
  )}&sort=popularity`;
}

/**
 *
 * @param {Page} page
 */
async function scrape(page) {
  await page.evaluate(() => {
    window.scrollBy({
      top: document.documentElement.scrollHeight - 1500,
      behavior: "smooth",
    });
  });

  try {
    await page.waitForNetworkIdle({ timeout: 3000 });
  } catch (error) {
    if (error.name === "TimeoutError") {
      console.error("Wait for images to load timed out, continuing...");
    } else {
      throw error;
    }
  }

  const products = [];
  const allProducts = await page.$$(".results-base li.product-base");
  for (const el of allProducts) {
    let urlEl = await el.$("a");
    const url = urlEl ? await urlEl.evaluate(el => el.href) : "";

    let imgUrlEl = await el.$("img");
    const imgUrl = imgUrlEl ? await imgUrlEl.evaluate(el => el.src) : "";

    let ratingsEl = await el.$(".product-ratingsContainer");
    let ratings = ratingsEl ? await ratingsEl.evaluate(el => el.textContent) : "";
    ratings = ratings.split("|").map(txt => getRatingsAsNumber(txt));

    let titleEl = await el.$(".product-product");
    const title = titleEl ? await titleEl.evaluate(el => el.textContent) : "";

    let brandEl = await el.$(".product-brand");
    const brand = brandEl ? await brandEl.evaluate(el => el.textContent) : "";

    let priceEl = await el.$(".product-price");
    let price = priceEl ? await priceEl.evaluate(el => el.textContent) : "";
    price = +price.match(/\d+/)?.[0] || 0;

    products.push({ title, brand, url, price, imgUrl, ratings });
  }

  return products;
}

/**
 * Scrapes products from myntra
 * @param {string} query
 * @param {number} maxPage
 */
async function getProducts(query, maxPage) {
  let browser = null;
  let page = null;

  try {
    browser = await getBrowser();
    page = await browser.newPage();
    await page.goto(getUrl(query), { timeout: 5000 });

    const pageInfo = await page.$(".pagination-paginationMeta");
    let maxPageAvailable =
      +(await pageInfo?.evaluate(el => el.textContent.match(/\d+$/)[0])) || maxPage;
    maxPageAvailable = maxPage > maxPageAvailable ? maxPageAvailable : maxPage;

    const products = [];
    for await (let i of Array.from({ length: maxPageAvailable }, (_, i) => i + 1)) {
      products.push(...(await scrape(page)));
      if (i < maxPage) {
        const nextBtn = await page.$(".pagination-next");
        if (nextBtn) {
          await page
            .locator(".pagination-next")
            .filter(el => !el.disabled)
            .click();
          await waitFor(1000);
        }
      }
    }

    return {
      products,
      error: null,
    };
  } catch (error) {
    if (error.name === "TimeoutError") {
      console.error("Page load timed out");
    } else {
      console.error("Unexpected error: ", error);
    }

    return {
      products: null,
      error,
    };
  } finally {
    await page?.close();
    await browser?.close();
  }
}

module.exports = { getProducts };
