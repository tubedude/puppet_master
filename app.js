const puppeteer = require('puppeteer');
const express = require('express');
const bodyParser = require('body-parser');
// const fs = require('fs');

const app = express();
app.use(express.static('public'));


// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

// /ping endpoint
app.get('/ping', (req, res) => {
    res.sendFile(__dirname + '/public/ping.html');
});

// Endpoint to generate DBML
app.get('/generate-dbml', async (req, res) => {
    console.log('Received request to generate DBML.');
    // const { url } = req.body;
    const { url } = req.query

    if (!url) {
        console.log('URL missing in request body.');
        return res.status(400).send('URL is required.');
    }

    console.log(`Extracting Bubble Data from URL: ${url}`);
    try {
        const rawData = await extractBubbleData(url);
        console.log('Raw Data extracted. Generating DBML syntax');
        // console.log("rawData", rawData);
        // res.set('Content-Type', 'Application/json');
        // res.send(rawData);
        // const dbmlData = generateDbDiagramSyntax(rawData);
        console.log('Sending DBML data response.');
        res.set('Content-Type', 'text/plain');
        res.send(rawData);
    } catch (error) {
        console.error("Error encountered:", error);
        res.status(500).send(`Error encountered: ${error.message}`);
    }
});

async function extractBubbleData(url) {
    console.log('Launching puppeteer browser.');
    const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: "new" });
    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(60000); // 60 seconds

    console.log(`Navigating to page: ${url}`);
    await page.goto(url);

    console.log('Evaluating the page.');
    const result = await page.evaluate(() => {
        const types = appquery.custom_types();
        const option_sets = appquery.option_sets();
        const dbdiagram_json = {};
        let dbdiagram_dbml = "";
        let option_sets_text = "\/\/ option_sets\n";
        let api = "\/\/ api calls datatype\n";

        function api_search(table, key, current_table, current_key) {
            // TODO need to add to the references file.
            // maybe need to pass the `current_table`
            //
            console.log(`running api_search(${table}, ${key})`);
            if (api.includes(`Table ${table} {`)) {
                const insertIndex = api.indexOf(`Table ${table} {`) +
                    `Table ${table} {`.length;
                api = api.slice(0, insertIndex) + `\n\t${key} int` +
                    api.slice(insertIndex);
            } else {
                api += `Table ${table} {\n\t${key} int\n}\n\n`;
            }
            references +=
                `\nRef: ${current_table}."${current_key}" > ${table}.${key}`;
            // console.log("api", api);
        }

        dbdiagram_dbml += ``;
        // iterate over the types
        types.forEach((item) => {
            dbdiagram_json[item.name()] = item.json.cache["%f3"];
            const table_name = item.name();

            // add the Table and the default Bubble fields
            dbdiagram_dbml +=
                `Table public.${table_name} {\n\t_id text [pk, unique]\n\t"Modified date" date\n\t"Created data" date`;

            // if it's the user table, add the email field
            if (table_name == "user") {
                dbdiagram_dbml += `\n\temail text [unique]`;
            }

            const child = item.json.cache["%f3"];
            for (let long_key in child) {
                // console.log("child", child[long_key]);
                // console.log("long_key", long_key);
                if (child.hasOwnProperty(long_key)) {
                    // Access the object using the property long_key
                    const innerObject = child[long_key];
                    let key = innerObject["%d"];
                    // skip if it's marked as deleted
                    if (!key.includes(" - deleted")) {
                        let value = innerObject["%v"];
                        let new_value = value; // use this variable to manipulate and put the value back into the text file
                        let connection_direction = "-";
                        let log_string = "logging starting";
                        if (value.includes("list.")) {
                            // log_string += "\nvalue includes list";
                            new_value = value.replace("list.", "");
                            // log_string += "\nstarting key: " + key + "\nvalue: " + value +  "\nnew_value: " + new_value;
                            if (value.includes("custom.")) {
                                // log_string += "\nkey has 'custom.'";
                                new_value = new_value.replace("custom.", "");
                                // add the reference to the references variable
                                connection_direction = ">";
                                new_value +=
                                    ` [ref: ${connection_direction} ${new_value}._id]`;
                            } else if (value.includes("user")) {
                                connection_direction = ">";
                                new_value += ` [ref: ${connection_direction} user._id]`;
                            } else {
                                new_value += "[]";
                            }
                        }
                        // log_string += "\nending:\nkey: " + key + "\nvalue: " + value + "\nnew_value: " + new_value;
                        // console.log(log_string);
                        //handle api key
                        // TODO change it to make it point to the API schema -- meaning, change the normal one to include public behind every table name
                        if (value.includes("api.")) {
                            // console.log("value includes api, calling function to create table");
                            value = value.replace("api.", "");

                            const dotIndex = value.indexOf(".");
                            const new_table = value.substring(0, dotIndex);
                            const new_key = value.substring(dotIndex + 1);

                            // console.log(new_table); // "stripe"
                            // console.log(new_key);

                            api_search(
                                new_table,
                                new_key.replace(/\[\]/g, ""),
                                table_name,
                                key,
                            );
                        }

                        value = value.replace("option.", "option_");
                        // console.log(`\n\t"${key}" ${new_value}`);
                        // console.log(`${new_value}`);
                        dbdiagram_dbml += `\n\t"${key}" ${new_value}`;
                    }
                    // dbdiagram_dbml += `\n`;

                    // Access the properties of the inner object
                    //console.log("innerObject", innerObject)
                }
            }
            dbdiagram_dbml += `\n}\n\n`;
        });

        // iterate over the option sets
        option_sets.forEach((item) => {
            const table_name = item.name();
            dbdiagram_json[table_name] = item.json.cache["%f3"];
            option_sets_text +=
                `Table option.${table_name} {\n\t"Display" text [pk, unique]`;
            const child = item.json.cache["attributes"];
            for (let long_key in child) {
                if (child.hasOwnProperty(long_key)) {
                    const innerObject = child[long_key];
                    let key = innerObject["%d"];
                    if (!key.includes("- deleted")) {
                        // Access the object using the property long_key
                        let value = innerObject["%v"];
                        if (value.includes("list.")) {
                            value = value.replace(/^list\./, "");
                            value += "[]";
                        }
                        // value = value.replace("option.", "option_");
                        option_sets_text += `\n\t"${key}" ${value}`;

                        // Access the properties of the inner object
                        //console.log("innerObject", innerObject)
                    }
                }
            }
            option_sets_text += `\n}\n\n`;
        });

        // add option sets
        dbdiagram_dbml += `\n${option_sets_text}`;

        // add the api to the bottom
        dbdiagram_dbml += `\n${api}`;

        return dbdiagram_dbml;
    });

    console.log('Closing the puppeteer browser.');
    await browser.close();

    return result;
}

function generateDbDiagramSyntax(raw_result) {
    const data = JSON.parse(raw_result);
    // const data = raw_result;

    if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid data format.");
    }

    if (!data[0].json || !data[0].json.cache) {
        throw new Error("Invalid data structure.");
    }

    data.forEach((item) => {
        const table_name = data.name();

        // add the Table and the default Bubble fields
        dbdiagram_dbml +=
            `Table public.${table_name} {\n\t_id text [pk, unique]\n\t"Modified date" date\n\t"Created data" date`;

        // if it's the user table, add the email field
        if (table_name == "user") {
            dbdiagram_dbml += `\n\temail text [unique]`;
        }

        const child = item.json.cache["%f3"];
        for (let long_key in child) {
            // console.log("child", child[long_key]);
            // console.log("long_key", long_key);
            if (child.hasOwnProperty(long_key)) {
                // Access the object using the property long_key
                const innerObject = child[long_key];
                let key = innerObject["%d"];
                if (!key.includes(" - deleted")) {
                    let value = innerObject["%v"];
                    let new_value = value; // use this variable to manipulate and put the value back into the text file
                    let connection_direction = "-";
                    let log_string = "logging starting";
                    if (value.includes("list.")) {
                        // log_string += "\nvalue includes list";
                        new_value = value.replace("list.", "");
                        // log_string += "\nstarting key: " + key + "\nvalue: " + value +  "\nnew_value: " + new_value;
                        if (value.includes("custom.")) {
                            // log_string += "\nkey has 'custom.'";
                            new_value = new_value.replace("custom.", "");
                            // add the reference to the references variable
                            connection_direction = ">";
                            new_value += ` [ref: ${connection_direction} ${new_value}._id]`;
                        } else if (value.includes("user")) {
                            connection_direction = ">";
                            new_value += ` [ref: ${connection_direction} user._id]`;
                        } else {
                            new_value += "[]";
                        };
                    }
                    // log_string += "\nending:\nkey: " + key + "\nvalue: " + value + "\nnew_value: " + new_value;
                    // console.log(log_string);
                    //handle api key
                    // TODO change it to make it point to the API schema -- meaning, change the normal one to include public behind every table name
                    if (value.includes("api.")) {
                        // console.log("value includes api, calling function to create table");
                        value = value.replace("api.", "");

                        const dotIndex = value.indexOf(".");
                        const new_table = value.substring(0, dotIndex);
                        const new_key = value.substring(dotIndex + 1);

                        // console.log(new_table); // "stripe"
                        // console.log(new_key);

                        api_search(new_table, new_key.replace(/\[\]/g, ""), table_name, key);
                    }

                    value = value.replace("option.", "option_");
                    // console.log(`\n\t"${key}" ${new_value}`);
                    // console.log(`${new_value}`);
                    dbdiagram_dbml += `\n\t"${key}" ${new_value}`;
                }
                // dbdiagram_dbml += `\n`;

                // Access the properties of the inner object
                //console.log("innerObject", innerObject)
            }
        }
        dbdiagram_dbml += `\n}\n\n`;
    });

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