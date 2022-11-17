const fs = require('fs');
const path = require('path');
const fm = require('front-matter');
const program = require('commander');

program
    .version('0.0.1', "-v, --version")
    .option('-c, --chapter <n>', 'An integer argument', parseInt, 0)
    .option('-s, --section <n>', 'An integer argument', parseInt)
    .parse(process.argv);

let id;
let title;
if (program.args.length < 2) {
    throw new Error('no collection id!');
} else {
    id = program.args[0];
    title = program.args[1].toString();
}

const options = program.opts();

let collection_path = path.join('src', id);
if (!fs.existsSync(collection_path)) {
    throw new Error(collection_path + ' does not exist!');
}

if (!options.chapter || options.chapter <= 0) {
    let last_chapter = 1;
    for (let dir of fs.readdirSync(collection_path)) {
        let dir_num = parseInt(dir.slice(1));
        if (fs.statSync(collection_path).isDirectory() && last_chapter <= dir_num) {
            last_chapter = dir_num;
        }
    }

    options.chapter = last_chapter;
}
let chapter_path = path.join(collection_path, 'c' + options.chapter);


let section_path;
if (options.section && fs.existsSync(chapter_path)) {
    section_path = path.join(chapter_path, 's' + options.section);

    if (options.section == 0) {
        let last_section = 1;
        for (let dir of fs.readdirSync(chapter_path)) {
            let dir_num = parseInt(dir.slice(1));
            if (fs.statSync(chapter_path).isDirectory() && last_section <= dir_num) {
                last_section = dir_num;
            }
        }

        options.section = last_section;
        section_path = path.join(chapter_path, 's' + options.section);
    }
}


if (section_path) {
    if (!fs.existsSync(section_path)) {
        fs.mkdirSync(section_path);
    }

    let content = [
        'const path = require("path");',
        '',
        'let dir = path.parse(__dirname).base;',
        '',
        'let section_number = 10000;',
        'if (dir[0] == "s" && dir.length > 1) {',
        '    section_number = parseInt(dir.slice(1));',
        '}',
        '',
        '',
        'module.exports = {',
        '    section: section_number,',
        '    section_title: "' + title + '"',
        '}',
    ].join("\n");
    let setting_file = path.parse(section_path).base + '.11tydata.js';

    console.log("Write: " + path.join(section_path, setting_file));
    console.log('Title: ' + title);

    fs.writeFileSync(path.join(section_path, setting_file), content);

} else if (chapter_path) {
    if (!fs.existsSync(chapter_path)) {
        fs.mkdirSync(chapter_path);
    }

    let content = [
        'const path = require("path");',
        '',
        'let dir = path.parse(__dirname).base;',
        '',
        'let chapter_number = 10000;',
        'if (dir[0] == "c" && dir.length > 1) {',
        '    chapter_number = parseInt(dir.slice(1));',
        '}',
        '',
        '',
        'module.exports = {',
        '    chapter: chapter_number,',
        '    chapter_title: "' + title + '"',
        '}',
    ].join("\n");
    let setting_file = path.parse(chapter_path).base + '.11tydata.js';

    console.log("Write: " + path.join(chapter_path, setting_file));
    console.log('Title: ' + title);

    fs.writeFileSync(path.join(chapter_path, setting_file), content);
}

/*
let last_story = 1;
for (let file of fs.readdirSync(section_path)) {
    let story_path = path.join(section_path, file);
    if (fs.statSync(story_path).isFile()) {
        let story_num = fm(fs.readFileSync(story_path).toString()).attributes.story;
        if (last_story <= story_num) {
            last_story = story_num + 1
        }
    }
}
*/
