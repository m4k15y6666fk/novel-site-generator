
const fs = require('fs-extra');
const path = require('path');

let xdg_data_home = path.join(process.env.HOME, '.local', 'share');
if (process.env.hasOwnProperty('XDG_DATA_HOME') && process.env.XDG_DATA_HOME.length > 0) {
    console.log('Exist XDG_DATA_HOME env');
    xdg_data_home = process.env.XDG_DATA_HOME;
}

/*
let xdg_config_home = path.join(process.env.HOME, '.config');
if (process.env.hasOwnProperty('XDG_CONFIG_HOME') && process.env.XDG_CONFIG_HOME.length > 0) {
    console.log('Exist XDG_CONFIG_HOME env');
    xdg_config_home = process.env.XDG_CONFIG_HOME;
}
*/


let repo_home = path.join(xdg_data_home, 'novel-site-generator', 'data');
if (!fs.existsSync(repo_home)) {
    console.log('Create: ' + repo_home);
    fs.mkdirSync(repo_home);
}

let archive_home = path.join(xdg_data_home, 'novel-site-generator', 'archive');
if (!fs.existsSync(archive_home)) {
    console.log('Create: ' + archive_home);
    fs.mkdirSync(archive_home);
}

for (let repo of fs.readdirSync(repo_home)) {
    console.log('Archive repository: ' + repo);
    fs.moveSync(path.join(repo_home, repo), path.join(archive_home, repo + Date.now()));
}
