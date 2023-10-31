const fs = require("fs");

const writeToFile = (diagram, url) => {
    url = new URL(url);
    url = url.hostname;
    const filePath = `./tests/sampleData/${url}.dbml`;
    fs.writeFile(filePath, diagram, (err) => {
        if (err) {
            console.error("Error writing to file:", err);
        } else {
            console.log("Content written to file successfully.");
        }
    });
};

module.exports = writeToFile;
