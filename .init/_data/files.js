const fs = require('fs');
const path = require('path');
const fm = require('front-matter');

module.exports = {
    parse: (file_path) => {
        const abstract_data = fs.readFileSync(file_path, 'utf8');
        const abstract_data_parsed = fm(abstract_data);

        const abstract_status = fs.statSync(file_path);

        return {
            content: abstract_data_parsed.body,
            data: abstract_data_parsed.attributes,
            status: {
                date: {
                    modified: abstract_status.mtime,
                    created: abstract_status.birthtime
                }
            }
        };
    },

    readJSON: (file_path) => {
        const content = fs.readFileSync(file_path);
        const json = JSON.parse(content.toString());

        return json;
    },

    ls: (dir_path) => {
        const dir = fs.statSync(dir_path);

        let result;
        if (dir.isDirectory()) {
            result = fs.readdirSync(dir_path);
        } else {
            result = [];
        }

        return result;
    },

    lsFile: (dir_path) => {
        const dir = fs.statSync(dir_path);

        let result = [];
        if (dir.isDirectory()) {
            for (let file_name of fs.readdirSync(dir_path)) {
                let file_path = dir_path + "/" + file_name;
                if (fs.existsSync(file_path)) {
                    let file = fs.statSync(file_path);
                    if (file.isFile()) {
                        result.push(file_name);
                    }
                }
            }
        }

        return result;
    },
}
