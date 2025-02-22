const express = require("express");
const axios = require("axios");
const puppeteer = require("puppeteer");

const app = express();
const PORT = 5000;

app.get("/api/getPrices", async (req, res) => {
  const { model } = req.query;
  if (!model) return res.status(400).json({ error: "Modelo requerido" });

  try {
    const prices = await fetchCarPrices(model);
    res.json(prices);
  } catch (error) {
    console.error("Error obteniendo precios", error);
    res.status(500).json({ error: "Error al obtener datos" });
  }
});

async function fetchCarPrices(model) {
  const sources = [fetchAutoScout, fetchMobileDe, fetchCochesNet];
  const results = await Promise.all(sources.map((fn) => fn(model)));
  return results.flat();
}

async function fetchAutoScout(model) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`https://www.autoscout24.com/lst?model=${model}`, {
    waitUntil: "domcontentloaded",
  });

  const cars = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".cldt-summary-full-item"))
      .slice(0, 5)
      .map((el) => ({
        modelo: el.querySelector("h2")?.innerText.trim() || "",
        precio: el.querySelector(".cldt-price")?.innerText.trim() || "",
        fuente: "AutoScout24",
        link: el.querySelector("a")?.href || "#",
      }));
  });
  await browser.close();
  return cars;
}

async function fetchMobileDe(model) {
  const response = await axios.get(
    `https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&scopeId=C&makeModelVariant1.modelDescription=${model}`
  );
  return [];
}

async function fetchCochesNet(model) {
  const response = await axios.get(
    `https://www.coches.net/segunda-mano/?Key=${model}`
  );
  return [];
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
