module.exports = () => {
	const data = appquery.custom_types() || [];
	const types = {}

	data.forEach((item) => {
		var name = item.json.__name;
		var fieldsObj = item.json.cache["%f3"];
		var fields = []
		for (let field in fieldsObj) {
			fields.push(field = {
				name: item.json.cache["%f3"][field]["%d"],
				type: item.json.cache["%f3"][field]["%v"]
			})
		}
		types[name] = {
			name: name,
			path: item.json.__path,
			fields: fields
		}
	})

	const osData = appquery.option_sets();
	const os = {};

	osData.forEach((item) => {
		var name = item.json.__name;
		var osObj = item.json.cache;
		var osAttributes = item.json.cache.attributes;
		var osValues = item.json.cache.values;
		var attributes = []
		let values = [];
		for (let attribute in osAttributes) {
			// console.log("attribute", osAttributes[attribute])
			attributes.push(attribute = {
				name: osAttributes[attribute]["%d"],
				value: osAttributes[attribute]["%v"],
			})
		}
		for (let value in osValues) {
			values.push(osValues[value])
		}
		os[name] = {
			name: name,
			path: item.json.__path,
			attributes: attributes,
			values: values
		}
	})

	// console.log(os);
	const db = {
		custom_types: types,
		option_sets: os
	}
	console.log(db);
	return db
}