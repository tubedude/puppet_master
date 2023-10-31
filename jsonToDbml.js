// const testData = require("./example.json");
// const fs = require("fs");

// reges pattern to use with api connector
// const regexApi = /^.+?\.(.+)\.[^.]+$/;
// const regexApi = /^api\.(.+)\.[^.]+$/;
const regexApi = /api\.(.+)/;

let dbdiagram = "";
const jsonToDbml = (db) => {
    db.custom_types.forEach((item) => {
        item.path = item.path.replace("user_types.", "custom.");
        dbdiagram += `Table ${item.path} {`;
        // TODO: add unique id
        dbdiagram += `\n\t_id text [pk, unique]`;
        // TODO: check if references are working

        // iterate through each field and create dbml fields
        item.fields.forEach((field) => {
			if (field.name.includes("- deleted")) return
            // handle list types
            let type = field.type || "";
            let refDirection = "-";
            type = userIdIfNeeded(type);
            type = handleApiConnector(type);
            if (type.includes("list.") && type.includes("custom.")) {
                type = type.replace(/list\.custom\./g, "");
                refDirection = ">";
            }
            if (type.includes("list.") && !type.includes("custom.")) {
                type = type.replace(/list\./g, "");
                type += `[]`;
            }

            field.name = quoteIfNeeded(field.name);
            if (type.includes("options.")) type = type.replace("options.", "option_sets.");
            dbdiagram += `\n\t${field.name} ${type}`;
            dbdiagram += refIfNeeded(type, refDirection);
            // if (field.type.includes(".")) {
            // 	dbdiagram += ` [ref: ${refDirection} ${type}]`
            // }
        });
        // close table
        dbdiagram += `\n}\n\n`;
    });

    db.option_sets.forEach((item) => {
        // split path by '.' so that each is rendered separatedly
        const split = item.path.split('.');
        dbdiagram += `Table ${quoteIfNeeded(split[0])}.${quoteIfNeeded(split[1])} {`;
		dbdiagram += `\n\tDisplay text`
        item.fields.forEach((field) => {
			if (field.name.includes("- deleted")) return
            // handle list types
            let type = field.type;
            let refDirection = "-";
            if (
                field.type.includes("list.") &&
                field.type.includes("custom.")
            ) {
                type = field.type.replace(/list\.custom\./g, "");
                refDirection = ">";
            }
            if (
                field.type.includes("list.") &&
                !field.type.includes("custom.")
            ) {
                type = field.type.replace(/list\./g, "");
                type += `[]`;
            }
            // split name and put it back together with quotes
            dbdiagram += `\n\t${quoteIfNeeded(field.name)} ${type}`;
        });
        dbdiagram += `\n}\n\n`;
    });

    // console.log(dbdiagram)

    // The file path where you want to write the content

    function quoteIfNeeded(type) {
        if (/[^a-z0-9]/i.test(type)) {
            return `"${type}"`;
        }
        return type;
    }

    function userIdIfNeeded(type) {
        if (type === "user") {
            return `custom.user`;
        }
        return type;
    }

    function refIfNeeded(type, refDirection) {
        if (type === undefined) {
            // console.log(type);
            return;
        }
        // fix for option sets naming convention
        type = type.replace("option.","option_sets.");
        let referenceId = "_id"
        if (type.includes("option_sets.")) referenceId = "Display"
        if (type.includes(".")) {
            if (type.includes("[]")) type = type.replace("[]", "");
            return ` [ref: ${refDirection} ${type}.${referenceId}]`;
        }
        return ``;
    }

    function handleApiConnector(type) {
        // TODO: create the api table if it doesn't exist, probably at the end of the initial loops, it checks for empty references and creates the needed tables.
        var match = type.match(regexApi);
        if (match) {
            // console.log(match);
            var capturedGroup = match[1];
            var replacedText = capturedGroup.replace(/\./g, "_");
            type = match[0].replace(match[1], replacedText);
            return type;
        }
        return type;
    }
    // console.log("[jsonToDbml] dbdiagram", dbdiagram);
    return dbdiagram;
};

module.exports = jsonToDbml;

// jsonToDbml(testData)
// Write the content to the file
// const filePath = './diagram.dbml';
// fs.writeFile(filePath, dbdiagram, err => {
//   if (err) {
// 	console.error('Error writing to file:', err);
//   } else {
// 	console.log('Content written to file successfully.');
//   }
// });
