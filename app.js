const puppeteer = require("puppeteer");
const express = require("express");
const bodyParser = require("body-parser");
const createDiagramJson = require("./createDiagramJson");
const jsonToDbml = require("./jsonToDbml");
// const writeToFile = require("./writeToFile");

const app = express();
app.use(express.static("public"));



/**
 * The object that is returned
 * @typedef {Object} result
 * @property {boolean} hasCourage - Indicates whether the Courage component is present.
 * @property {boolean} hasPower - Indicates whether the Power component is present.
 * @property {boolean} hasWisdom - Indicates whether the Wisdom component is present.
 */

// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

// /ping endpoint
app.get("/ping", (req, res) => {
    res.sendFile(__dirname + "/public/ping.html");
});

// Endpoint to generate DBML
app.get("/generate-dbml", async (req, res) => {
    const result = {};
    console.log("Received request to generate DBML.");
    // const { url } = req.body;
    const { url, addref = 'false' } = req.query;
    const add_ref = Boolean(addref.toLowerCase() === 'true')
    console.log("[typeof addref]", typeof addref);
    console.log("[addref]", addref);
    console.log("[typeof add_ref]", typeof add_ref);
    console.log("[add_ref]", add_ref);
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
        if (result.isBubbleApp === false) {
            return res.status(422).json({
                error: "it's not a Bubble app",
                isBubbleApp: result.isBubbleApp,
            })
        }

        console.log("extracting db in json format");
        result.db = await extractBubbleData(page);
        // writeToFile(JSON.stringify(result.db), result.url, "json");

        console.log("Raw Data extracted. Generating DBML syntax");
        result.diagram = jsonToDbml(result.db, add_ref);

        // writeToFile(result.diagram, result.url, "dbml");


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
    return isBubbleApp;
}

async function extractBubbleData(page) {
    console.log("Evaluating the page.");
    return await createDiagramJson(page);
}

module.exports = {
    app,
};
