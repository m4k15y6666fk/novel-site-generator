const os = require('os');
const path = require('path');
const fs = require('fs');

module.exports = () => {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'com.m4k15y6666fk.NovelSiteGenerator.'));
}
