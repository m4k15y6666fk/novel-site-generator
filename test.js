
const express = require('express');

let app = express();

let server = app.listen(3000);
app.get('/', (req, res) => {
    res.type('.txt');
    res.send('OK');
});

server.close();

server = app.listen(8000);
app.get('/', (req, res) => {
    res.type('.txt');
    res.send('OK');
});
