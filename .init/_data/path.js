const path = require('path');

module.exports = {
    parse: (file) => {
        return path.parse(file);
    },

    join: (array) => {
        return path.join(...array);
    },

    base: path.parse(__dirname).dir
}
