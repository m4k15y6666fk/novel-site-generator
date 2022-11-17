const fs = require('fs');
const path = require('path');
const fm = require('front-matter');

let id;
let chapter;
let section;
if (process.argv.length >= 3) {
    id = process.argv[2];
} else {
    throw new Error();
}
if (process.argv.length >= 4) {
    chapter = process.argv[3];
} else {
    chapter = 1;
}
if (process.argv.length >= 5) {
    section = process.argv[4];
} else {
    section = 1;
}

let section_path = path.join('src', id, 'c' + chapter, 's' + section);

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

let content = [
    '---',
    'title: "[タイトル未定]"',
    '',
    'story: ' + last_story,
    '',
    'publish: false # 公表する場合は "true" に設定',
    '---',
    '<!--- ここから本文 --->',
    '',
].join('\n');

last_story = ('000000' + last_story).slice(-6);
fs.writeFileSync(path.join(section_path, 'story-' + last_story + '.md'), content);
