
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    img: (hash, width = 80) => {
        let json = fs.readJsonSync(path.join(__dirname, '..', 'assets', 'img', 'upload.json'));

        let attributes = [];

        let style = [
            'display: block;',
            'margin: auto;',
            'border-radius: 10px;'
        ];
        if (width) {
            style.push('width: ' + parseInt(width) + '%;');
        }

        attributes.push('style="' + style.join(' ') + '"');


        let data = json.find((item) => item.hash == hash);
        if (data) {
            attributes.push('src="' + data.src + '"');
            attributes.push('alt="' + data.title + '"');
        } else {
            attributes.push('src=""');
            attributes.push('alt=""');
        }

        return '<img ' + attributes.join(' ') + ' >';
    },
}
