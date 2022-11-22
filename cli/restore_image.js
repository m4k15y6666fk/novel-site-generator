
const fs = require('fs-extra');
const path = require('path');
const program = require('commander');

program
    .version('0.0.1', "-v, --version")
    .option('-o, --output <string>', 'Path to JSON')
    .parse(process.argv);

let file = program.args[0];
let options = program.opts();

if (!path.isAbsolute(file)) {
    file = path.join(process.cwd(), file);
}
if (!path.isAbsolute(options.output)) {
    options.output = path.join(process.cwd(), options.output);
}

if (!fs.existsSync(file)) {
    throw new Error('not exists file');
}

if (!fs.existsSync(options.output) || !fs.statSync(options.output).isDirectory()) {
    console.log('create: ' + options.output);
    fs.mkdirsSync(options.output);
}

let data;
try{
    data = fs.readJsonSync(file);
} catch(e) {
    console.error(e);
}

for (let item of data) {
    let base64 = item.src.split(',')[1];

    let mime = item.type;
    let ext = mime.split('/')[1];

    console.log('restore: ' + path.join(options.output, item.hash + '.' + ext));
    fs.outputFileSync(
        path.join(options.output, item.hash + '.' + ext),
        Buffer.from(base64, 'base64')
    );
}
