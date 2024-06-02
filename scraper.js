const { getBrowser } = require("./browser");

const BASE_URL = "https://www.myntra.com/";

function getRatingsAsNumber(text) {
  if (text.endsWith("k")) {
    return Number(text.slice(0, text.length - 1) * 1000);
  }
  return Number(text);
}

/**
 * Scrapes products from myntra
 * @param {string} query
 */
async function getProducts(query) {
  let browser = null;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.goto(
      BASE_URL +
        query.replace(" ", "-") +
        `?rawQuery=${encodeURI(query)}&sort=popularity`,
      { timeout: 5000 }
    );
    await page.evaluate(() => {
      document.querySelector(".pagination-next")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
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
      price = price.match(/\d+/)?.[0] || 0;

      products.push({ title, brand, url, price, imgUrl, ratings });
    }

    page.close();

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
    await browser?.close();
  }
}

module.exports = { getProducts };
