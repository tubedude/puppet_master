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

}

dbdiagram_dbml += ``;
// iterate over the types
types.forEach((item) => {
	dbdiagram_json[item.name()] = item.json.cache["%f3"];
	const table_name = item.name();

	// add the Table and the default Bubble fields
	dbdiagram_dbml +=
		`Table custom.${table_name} {\n\t_id text [pk, unique]\n\t"Modified date" date\n\t"Created data" date`;

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
			
				let value = innerObject["%v"];
				let new_value = value; // use this variable to manipulate and put the value back into the text file
				let connection_direction = "-";
				let log_string = "logging starting";
				if (value.includes("list.")) {
				
					new_value = value.replace("list.", "");
			
			// handle the connection direction
					if (value.includes("custom.")) {
						connection_direction = ">";
						new_value +=
							` [ref: ${connection_direction} ${new_value}._id]`;
					} else {
						new_value += "[]";
					}
				}
				
				//handle api key
				// TODO change it to make it point to the API schema
				// meaning, change the normal one to include public behind every table name
				// TODO the api schema has multiple dots, mitigate that
				if (value.includes("api.")) {
					// console.log("value includes api, calling function to create table");
					value = value.replace("api.", "");

					const dotIndex = value.indexOf(".");
					const new_table = value.substring(0, dotIndex);
					const new_key = value.substring(dotIndex + 1);
					api_search(
						new_table,
						new_key.replace(/\[\]/g, ""),
						table_name,
						key,
					);
				}
				dbdiagram_dbml += `\n\t"${key}" ${new_value}`;
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

console.log(dbdiagram_dbml)