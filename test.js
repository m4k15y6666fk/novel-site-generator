
const find_empty_port = require('./script/port.js');

find_empty_port()
.then((port) => {
    console.log(port);
});
