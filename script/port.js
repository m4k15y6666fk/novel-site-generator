const net = require('net');

module.exports = _ => {
    let port = 10000 + Math.floor(Math.random() * 1000);
    let socket = new net.Socket();
    let server = new net.Server();

    function loop() {
        if (port >= 20000) {
            throw new Error('20000 番まで空き port がありません');
        } else {
            port++;
        }

        socket.connect(port, '127.0.0.1', _ => {
            socket.destroy();
            loop();
        });
    };


    return new Promise((resolve) => {
        loop();

        socket.on('error', (e) => {
            try {
                server.listen(port, '127.0.0.1');
                server.close();

                resolve(port);
            } catch(__) {
                loop();
            };
        });
    });
};
