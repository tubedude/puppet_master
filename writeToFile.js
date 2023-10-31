const fs = require("fs");

const writeToFile = (data, url, extension) => {
    url = new URL(url);
    url = url.hostname;
    const filePath = `./tests/sampleData/${url}.${extension || "dbml"}`;
    try {
        fs.writeFileSync(filePath, data);
        console.log("Content written to file successfully.");
    } catch (err) {
        console.error("Error writing to file:", err);
    }
};

module.exports = writeToFile;
