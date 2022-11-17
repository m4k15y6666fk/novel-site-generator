const child_process = require('child_process');

module.exports = {
    add: function(origin) {
        return new Promise((resolve) => {
            let command = child_process.spawn('git', ['-C', origin, 'add', '.']);


            command.stdout.on('data', (data) => {
                console.log('[git add] ' + data);
            });
            command.stderr.on('data', (data) => {
                console.error('[git add] ' + data);
            });

            command.on('close', (code) => {
                console.log('[git add] Result: exited with code:' + code);
                resolve({
                    exit: code,
                    success: code == 0
                });
            });
        });
    },

    commit: function(origin, comment) {
        return new Promise((resolve) => {
            let command = child_process.spawn('git', [
                '-C', origin, 'commit', '-m', comment
            ]);


            command.stdout.on('data', (data) => {
                console.log('[git commit] ' + data);
            });
            command.stderr.on('data', (data) => {
                console.error('[git commit] ' + data);
            });

            command.on('close', (code) => {
                console.log('[git commit] Result: exited with code:' + code);
                resolve({
                    exit: code,
                    success: code == 0
                });
            });
        });
    },

    init: function(origin) {
        return new Promise((resolve) => {
            let command = child_process.spawn('git', [
                '-C', origin, 'init'
            ]);


            command.stdout.on('data', (data) => {
                console.log('[git init] ' + data);
            });
            command.stderr.on('data', (data) => {
                console.error('[git init] ' + data);
            });

            command.on('close', (code) => {
                console.log('[git init] Result: exited with code:' + code);
                resolve({
                    exit: code,
                    success: code == 0
                });
            });
        });
    }
}
