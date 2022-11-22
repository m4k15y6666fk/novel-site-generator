
const child_process = require('child_process');
const path = require('path');

async function render({ input, output, config, prefix, cwd }) {
    return new Promise((resolve) => {

        let elev = child_process.spawn(path.join(__dirname, '..', 'node_modules', '.bin', 'eleventy'), [
            '--input=' + input,
            '--output=' + output,
            '--config=' + config,
            '--pathprefix=' + prefix,
            '--quiet',
            '--to=json'
        ], {
            cwd: cwd
        });

        let result = '';
        elev.stdout.on('data', (data) => {
            result = result + data.toString();
        });
        elev.stderr.on('data', (data) => {
            console.error(data);
        });
        elev.on('close', _ => {
            resolve(result);
        });

    });
}

module.exports = render;
