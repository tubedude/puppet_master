const testData = require("./example.json");
const fs = require("fs");
const jsonToDbml = require("../jsonToDbml");

const dbdiagram = jsonToDbml(testData);
// Write the content to the file
const filePath = "./tests/diagram.dbml";
fs.writeFile(filePath, dbdiagram, (err) => {
    if (err) {
        console.error("Error writing to file:", err);
    } else {
        console.log("Content written to file successfully.");
    }
});
