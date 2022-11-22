
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    img: (hash, width) => {
        const json = fs.readJsonSync(path.join(__dirname, '..', 'assets', 'img', 'upload.json'));
        const size = '';
        if (width) {
            size = 'style ="width: ' + parseInt(width) + '%;"';
        }

        let result = '<img src="" alt="">';
        let data = json.find((item) => item.hash == hash);
        if (data) {
            result = '<img src="' + data.src + '" alt="' + data.title + '" ' + size + '>';
        }

        return result;
    },
}
