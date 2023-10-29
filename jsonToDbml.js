const testData = require('./example.json')
const fs = require('fs');

// reges pattern to use with api connector
// const regexApi = /^.+?\.(.+)\.[^.]+$/;
// const regexApi = /^api\.(.+)\.[^.]+$/;
const regexApi = /api\.(.+)/;

let dbdiagram = "";
testData.custom_types.forEach((item) => {
	item.path = item.path.replace("user_types.", "custom.") 
	dbdiagram += `Table ${item.path} {`
	// TODO: add unique id
	dbdiagram += `\n\t_id text [pk, unique]`
	// TODO: check if references are working
	
	// iterate through each field and create dbml fields
	item.fields.forEach((field) => {
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

		dbdiagram += `\n\t${field.name} ${type}`
		dbdiagram += refIfNeeded(type, refDirection);
		// if (field.type.includes(".")) {
		// 	dbdiagram += ` [ref: ${refDirection} ${type}]`
		// }
		
		
	})
	// close table
	dbdiagram += `\n}\n\n`
});

testData.option_sets.forEach((item) => {
	dbdiagram += `Table ${item.path} {`
		item.attributes.forEach((attribute) => {
			// handle list types
			let type = attribute.type;
			let refDirection = "-";
			if (attribute.type.includes("list.") && attribute.type.includes("custom.")) {
				type = attribute.type.replace(/list\.custom\./g, "");
				refDirection = ">";
			}
			if (attribute.type.includes("list.") && !attribute.type.includes("custom.")) {
				type = attribute.type.replace(/list\./g, "");
				type += `[]`;
			}
			// TODO add [ref:]
			dbdiagram += `\n\t${attribute.name} ${type}`
		})
	dbdiagram += `\n}\n\n`
})

// console.log(dbdiagram)

// The file path where you want to write the content
const filePath = './diagram.dbml';


function quoteIfNeeded(type) {
  if (/[^a-z0-9]/i.test(type)) {
	return `"${type}"`;
  }
  return type;
}

function userIdIfNeeded(type) {
	if (type === "user") {
		return `custom.user`
	}
	return type;
}

function refIfNeeded(type, refDirection) {
	if (type === undefined) {
		console.log(type);
		return
	}
	if (type.includes(".")) {
		if (type.includes("[]")) type = type.replace("[]","");
		return ` [ref: ${refDirection} ${type}._id]`
	}
	return ``;
}



function handleApiConnector(type) {
	// TODO: create the api table if it doesn't exist, probably at the end of the initial loops, it checks for empty references and creates the needed tables.
	var match = type.match(regexApi);
	if (match) {
		console.log(match);
		var capturedGroup = match[1];
		var replacedText = capturedGroup.replace(/\./g , "_");
		type = match[0].replace(match[1], replacedText)
		console.log("type to be returned: ", type)
		return type;
	}
	return type;
}

// Write the content to the file
fs.writeFile(filePath, dbdiagram, err => {
  if (err) {
	console.error('Error writing to file:', err);
  } else {
	console.log('Content written to file successfully.');
  }
});
