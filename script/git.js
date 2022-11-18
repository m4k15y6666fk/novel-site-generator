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
    },

    config: function(origin, name, value) {
        return new Promise((resolve) => {
            let command = child_process.spawn('git', [
                '-C', origin, 'config', '--local', name, value
            ]);


            command.stdout.on('data', (data) => {
                console.log('[git config] ' + data);
            });
            command.stderr.on('data', (data) => {
                console.error('[git config] ' + data);
            });

            command.on('close', (code) => {
                console.log('[git config] Result: exited with code:' + code);
                resolve({
                    exit: code,
                    success: code == 0
                });
            });
        });
    },

    revert: function(origin, hash) {
        return new Promise((resolve) => {
            let command = child_process.spawn('git', [
                '-C', origin, 'revert', hash + '..HEAD', '--no-commit'
            ]);


            command.stdout.on('data', (data) => {
                console.log('[git revert] ' + data);
            });
            command.stderr.on('data', (data) => {
                console.error('[git revert] ' + data);
            });

            command.on('close', (code) => {
                console.log('[git revert] Result: exited with code:' + code);
                resolve({
                    exit: code,
                    success: code == 0
                });
            });
        });
    },

    reset: function(origin, hash) {
        return new Promise((resolve) => {
            let command = child_process.spawn('git', [
                '-C', origin, 'reset', '--hard', hash
            ]);


            command.stdout.on('data', (data) => {
                console.log('[git reset] ' + data);
            });
            command.stderr.on('data', (data) => {
                console.error('[git reset] ' + data);
            });

            command.on('close', (code) => {
                console.log('[git reset] Result: exited with code:' + code);
                resolve({
                    exit: code,
                    success: code == 0
                });
            });
        });
    },

    checkout: function(origin, hash) {
        return new Promise((resolve) => {
            let command = child_process.spawn('git', [
                '-C', origin, 'checkout', hash
            ]);


            command.stdout.on('data', (data) => {
                console.log('[git checkout] ' + data);
            });
            command.stderr.on('data', (data) => {
                console.error('[git checkout] ' + data);
            });

            command.on('close', (code) => {
                console.log('[git checkout] Result: exited with code:' + code);
                resolve({
                    exit: code,
                    success: code == 0
                });
            });
        });
    },

    sync: {
        log: function(origin) {
            return child_process.spawnSync('git', [
                '-C', origin, 'log', '--format=format:%h|%ci|%s'
            ]);
        },

        logOnlyShortHash: function(origin) {
            return child_process.spawnSync('git', [
                '-C', origin, 'log', '--format=format:%h'
            ]);
        },

        logOnlySubject: function(origin) {
            return child_process.spawnSync('git', [
                '-C', origin, 'log', '--format=format:%s'
            ]);
        }
    }
}
