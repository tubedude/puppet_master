

function refIfNeeded(type, refDirection, add_ref) {

    if (type === undefined) {
        return;
    }
    // fix for option sets naming convention
    type = type.replace("option.", "option_sets.");
    let referenceId = "_id";
    if (type.includes("option_sets.")) referenceId = "Display";
    if (type.includes(".") && add_ref) {
        if (type.includes("[]")) type = type.replace("[]", "");
        return ` [ref: ${refDirection} ${type}.${referenceId}]`;
    }
    return ``;

}

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

const regexApi = /api\.(.+)/;
function handleApiConnector(type, apiDbdiagram) {
    // convert string to array of lines
    var arr = apiDbdiagram.split('\n');

    var match = type.match(regexApi);
    if (match) {
    // console.log("[handleApiConnector] begin apiDbdiagram", apiDbdiagram)
        var capturedGroup = match[1];
        var replacedText = capturedGroup.replace(/\./g, "_");
        var newType = match[0].replace(match[1], replacedText);

        var strToAdd1 = `Table ${newType} {`;
        // var strToAdd2 = `${newType}`;

        // Check if the line Table ${type} already exists. If not, add it.
        if (!arr.includes(strToAdd1)) {
            arr.push(strToAdd1);
            arr.push(`\t_id text`)
            arr.push(`}\n`);
        } 

        // Find the line with Table ${type} and add {${type}} after it.
/*         var tableIndex = arr.indexOf(strToAdd1);
        if (tableIndex !== -1 && (tableIndex === arr.length-1 || !arr[tableIndex+1].startsWith(`${newType}`))) {
            arr.splice(tableIndex + 1, 0, strToAdd2);
        } */

        // convert array back into string
        apiDbdiagram = arr.join('\n');

        return [newType, apiDbdiagram]
    }

    return [type, apiDbdiagram];
}


const jsonToDbml = (db, add_ref) => {
    console.log("looping through jsonToDbml, add_ref param is set to: " + add_ref);
    let dbdiagram = "";
    let apiDbdiagram = "";
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
            
            const apiHandling = handleApiConnector(type, apiDbdiagram);
            type = apiHandling[0];
            apiDbdiagram = apiHandling[1]
            
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
            dbdiagram += refIfNeeded(type, refDirection, add_ref);
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
            const apiHandling = handleApiConnector(type, apiDbdiagram);
            type = apiHandling[0];
            apiDbdiagram = apiHandling[1]

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
            dbdiagram += refIfNeeded(type, refDirection, add_ref)
        });
        dbdiagram += `\n}\n\n`;
    });
    
    dbdiagram += `\n\n${apiDbdiagram}`

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
