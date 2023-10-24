const puppeteer = require('puppeteer');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(express.static('public'));


// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

// /ping endpoint
app.get('/ping', (req, res) => {
    res.sendFile(__dirname + '/public/ping.html');
});

// Endpoint to generate DBML
app.post('/generate-dbml', async (req, res) => {
    console.log('Received request to generate DBML.');
    const { url } = req.body;

    if (!url) {
        console.log('URL missing in request body.');
        return res.status(400).send('URL is required.');
    }

    console.log(`Extracting Bubble Data from URL: ${url}`);
    try {
        const rawData = await extractBubbleData(url);
        console.log('Raw Data extracted. Generating DBML syntax.');
        const dbmlData = generateDbDiagramSyntax(rawData);
        console.log('Sending DBML data response.');
        res.set('Content-Type', 'text/plain');
        res.send(dbmlData);
    } catch (error) {
        console.error("Error encountered:", error);
        res.status(500).send(`Error encountered: ${error.message}`);
    }
});

async function extractBubbleData(url) {
    console.log('Launching puppeteer browser.');
    const browser = await puppeteer.launch({args: ['--no-sandbox'], headless: "new" });
    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(60000); // 60 seconds

    console.log(`Navigating to page: ${url}`);
    await page.goto(url);

    console.log('Evaluating the page.');
    const result = await page.evaluate(() => {
        console.log('Inside page evaluation.');
        const getCircularReplacer = () => {
            const seen = new WeakSet();
            return (key, value) => {
                if (typeof value === "object" && value !== null) {
                    if (seen.has(value)) {
                        return;
                    }
                    seen.add(value);
                }
                return value;
            };
        };

        if (typeof appquery.custom_types === 'function') {
            console.log('appquery.custom_types found. Fetching data.');
            const data = appquery.custom_types();
            return JSON.stringify(data, getCircularReplacer());
        } else {
            console.error('Function appquery.custom_types() not found.');
            throw new Error('Function appquery.custom_types() not found.');
        }
    });

    console.log('Closing the puppeteer browser.');
    await browser.close();

    return result;
}

function generateDbDiagramSyntax(raw_result) {
    const data = JSON.parse(raw_result);

    if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid data format.");
    }

    if (!data[0].json || !data[0].json._parent || !data[0].json._parent.cache) {
        throw new Error("Invalid data structure.");
    }

    const customTypes = data[0].json._parent.cache;
    let output = '';

    for (const typeName in customTypes) {
        const type = customTypes[typeName];
        if (type && type["%f3"]) {
            const fields = type["%f3"];
            output += `Table ${typeName} {\n`;
            for (const fieldName in fields) {
                const field = fields[fieldName];
                const fieldType = quoteIfNeeded(field["%v"] || "");
                output += `  ${fieldName} ${fieldType}\n`;
            }
            output += '}\n\n';
        }
    }

    return output;
}


function quoteIfNeeded(type) {
    if (type.includes('.')) {
        return `"${type}"`;
    }
    return type;
}

module.exports = {
    app,
    generateDbDiagramSyntax,
    quoteIfNeeded,
    extractBubbleData
};