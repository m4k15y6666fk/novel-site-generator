const fs = require('fs');
const path = require('path');
const fm = require('front-matter');

let id = process.argv[2];
let collection_path = path.join('src', id);
let abstract_path = path.join('src', 'abstract', id + '.md');

let json = [];

let abstract_content = fs.readFileSync(abstract_path);
let abstract_frontmatter = fm(abstract_content.toString());

json.push('');
json.push('Title: ' + abstract_frontmatter.attributes.title +
          ' (by ' + abstract_frontmatter.attributes.author + ')');

let chapters = [];
for (let chapter_dir of fs.readdirSync(collection_path)) {
    let chapter_path = path.join(collection_path, chapter_dir);
    if (fs.statSync(chapter_path).isDirectory()) {
        let content = require(path.join('..', chapter_path, chapter_dir + '.11tydata.js'));

        let sections = [];
        for (let section_dir of fs.readdirSync(chapter_path)) {
            let section_path = path.join(chapter_path, section_dir);
            if (fs.statSync(section_path).isDirectory()) {
                let content = require(path.join('..', section_path, section_dir + '.11tydata.js'));

                sections.push(content);
            }
        }
        sections.sort((a, b) => a.section - b.section);

        content.child = sections;
        chapters.push(content);
    }
}
chapters.sort((a, b) => a.chapter - b.chapter);



for (let chapter of chapters) {
    json.push('|');
    json.push('|--- Chapter ' + chapter.chapter + ': ' + chapter.chapter_title);

    for (let section of chapter.child) {
        json.push('|    |--- Section ' + section.section + ': ' + section.section_title);
    }
}



json.push('');
console.log(json.join('\n'));
