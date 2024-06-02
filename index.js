const express = require("express");
const { getProducts } = require("./scraper");
const app = express();

const PORT = process.env.PORT || 4000;

app.get("/scrape", async (req, res) => {
  const query = req.query?.q;
  if (!query) {
    return res.status(400).send({ error: "query is required" });
  }
  const products = await getProducts(query);
  res.send(products);
});

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

app.listen(PORT, () => {
  console.log(`Listening on port http://localhost:${PORT}`);
});
