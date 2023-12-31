let appquery

module.exports = async (page) => {
    const db = await page.evaluate(() => {
        const data = appquery.custom_types() || [];
        const types = [];

        data.forEach((item) => {
            var name = item.json.__name;
            var fieldsObj = item.json.cache["%f3"];
            var fields = [];
            for (let field in fieldsObj) {
                let type = item.json.cache["%f3"][field]["%v"];
                if (type.includes("option.")) type = type.replace("option.", "option_sets.");
                fields.push(
                    (field = {
                        name: item.json.cache["%f3"][field]["%d"],
                        type: type,
                    })
                );
            }
            types.push(
                (name = {
                    name: name,
                    path: item.json.__path,
                    fields: fields,
                })
            );
        });

        const osData = appquery.option_sets();
        const os = [];

        osData.forEach((item) => {
            var name = item.json.__name;
            // var osObj = item.json.cache;
            var osAttributes = item.json.cache.attributes;
            var osValues = item.json.cache.values;
            var attributes = [];
            let values = [];
            for (let attribute in osAttributes) {
                attributes.push(
                    (attribute = {
                        name: osAttributes[attribute]["%d"],
                        type: osAttributes[attribute]["%v"],
                    })
                );
            }
            for (let value in osValues) {
                values.push(osValues[value]);
            }
            os.push(
                (name = {
                    name: name,
                    path: item.json.__path,
                    fields: attributes,
                    values: values,
                })
            );
        });

        // console.log(os);
        const db = {
            custom_types: types,
            option_sets: os,
        };
        return db;
    });
    return db;
};
