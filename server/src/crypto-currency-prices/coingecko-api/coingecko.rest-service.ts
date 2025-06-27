import { parse } from "node-html-parser";
import { logger } from "../logger/logger";
import { HttpError } from "../../common/error/HttpError";
import { Quotes } from "../../model/crypto-currency-prices/crypto-currency-quotes";
import { formatDate } from "../../common/util/date-utils";
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

export class CoingeckoRestService {
  async fetchPrices(
    tokenIds: string[],
    currency: string,
  ): Promise<{ [tokenId: string]: { [currency: string]: number } }> {
    logger.info(`CoingeckoRestService.fetchPrices for ${tokenIds.join(",")}`);
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(",")}&vs_currencies=${currency}&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false`,
      {
        method: "GET",
      },
    );
    if (!response.ok) {
      throw new HttpError(response.status, response.statusText);
    }
    return response.json();
  }

  private csvToJson(csvString: string, delimiter: string = ","): any[] {
    const rows = csvString.split("\n");

    const headers = rows[0].split(delimiter);

    const jsonData = [];
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(delimiter);
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        const key = headers[j].trim();
        const value = (values[j] || "").trim();
        obj[key] = value;
      }
      jsonData.push(obj);
    }
    return jsonData;
  }

 

  private async getPageContent(url: string): Promise<string> {
      puppeteer.use(StealthPlugin());
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url);
      const content = await page.content();
      await browser.close();
      return content
    } 

  private async getExportDataUrl(tokenId: string) {
    const content = await this.getPageContent("https://www.coingecko.com/en/coins/" + tokenId + "/historical_data")
    const document = parse(content);
    const exportLink = document.querySelector(
      '[data-coin-historical-data-target="exportDropdownMenu"] [data-view-component] span:nth-child(2)',
    );
    const dataUrl = exportLink.getAttribute("data-url");
    return dataUrl;
  }

  async fetchHistoricalData(
    tokenId: string,
    currency: string = "usd",
  ): Promise<Quotes> {
    logger.info("Entry fetchHistoricalData for " + tokenId + " in " + currency)
    let dataUrl = "";
    try {
      dataUrl = (await this.getExportDataUrl(tokenId)).replace(
        "usd.csv",
        currency.toLocaleLowerCase() + ".csv",
      );
    } catch (error) {
      logger.warn("No quotes found for token " + tokenId);
      logger.warn(error)
      return undefined;
    }
    const url = "https://www.coingecko.com" + dataUrl
    logger.info("Fetching data from url: " + url)
    const response = await fetch(url);
    const csv = await response.text();
    let json = this.csvToJson(csv).filter((d) => d["snapped_at"] && d["price"]);
    const result: { timestamp: number } = {
      timestamp: Date.now(),
    };
    for (let dataPoint of json) {
      // coingecko return quotes for beginning of day, but we are interested in end-of-day quotes
      // => price from start of day 2025-01-03 is saved with key "2025-01-02" (end of day)
      const previousDay = formatDate(
        new Date(Date.parse(dataPoint["snapped_at"]) - 86400000),
      );
      result[previousDay] = Number(dataPoint["price"]);
    }
    
    logger.info(`Exit fetchHistoricalData with ${Object.keys(result).length} data points`)
    return result;
  }
}
