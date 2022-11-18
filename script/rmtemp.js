const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');

let pattern = path.join(os.tmpdir(), 'com.m4k15y6666fk.NovelSiteGenerator.') + '*';

module.exports = () => {
    let list = [];
    try {
        list = glob.sync(pattern);

        for (let file of list) {
            console.log('[init] Remove: ' + file);
            fs.removeSync(file);
        }
    } catch(error) {
        console.log(error);
    }

    return list;
}
