const puppeteer = require("puppeteer");
const express = require("express");
const bodyParser = require("body-parser");
const createDiagramJson = require("./createDiagramJson");
const jsonToDbml = require("./jsonToDbml");
const writeToFile = require("./writeToFile");

const app = express();
app.use(express.static("public"));

/**
 * The object that is returned
 * @typedef {Object} result
 * @property {boolean} hasCourage - Indicates whether the Courage component is present.
 * @property {boolean} hasPower - Indicates whether the Power component is present.
 * @property {boolean} hasWisdom - Indicates whether the Wisdom component is present.
 */
const result = {
    error: "", // error object's message
    url: "", // the url that is returned
    diagram: "", // the string of the dbml
    isBubbleApp: true, // boolean if the Bubble app
    db: {}, // json of extracted json data
};

// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

// /ping endpoint
app.get("/ping", (req, res) => {
    res.sendFile(__dirname + "/public/ping.html");
});

// Endpoint to generate DBML
app.get("/generate-dbml", async (req, res) => {
    console.log("Received request to generate DBML.");
    // const { url } = req.body;
    const { url } = req.query;
    result.url = url;
    res.set("Content-Type", "application/json");

    if (!url) {
        console.log("URL missing in query params.");
        return res.status(400).send("URL is required.");
    }

    console.log("Launching puppeteer browser.");
    const browser = await puppeteer.launch({
        args: [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--single-process",
            "--no-zygote",
        ],
        headless: "new",
    });

    console.log(`Extracting Bubble Data from URL: ${url}`);
    try {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(60000); // 60 seconds
        console.log(`Navigating to page: ${url}`);
        await page.goto(url);

        console.log("checking if url is a Bubble app");
        result.isBubbleApp = await isBubbleApp(page);
        console.log("isBubbleApp", result.isBubbleApp);

        console.log("extracting db in json format");
        result.db = await extractBubbleData(page);

        console.log("Raw Data extracted. Generating DBML syntax");
        result.diagram = jsonToDbml(result.db);

        await writeToFile(result.diagram, result.url);

        console.log("Sending DBML data response.");
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error encountered:", error);
        result.error = error;
        res.status(500).json(result);
    } finally {
        console.log("closing puppeteer browser");
        await browser.close();
    }
});

async function isBubbleApp(page) {
    const isBubbleApp = await page.evaluate(() => {
        return typeof appquery === "function";
    });
    console.log("isBubbleApp", isBubbleApp);
}

async function extractBubbleData(page) {
    console.log("Evaluating the page.");
    return await createDiagramJson(page);
}

module.exports = {
    app,
};
