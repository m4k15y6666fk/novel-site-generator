const fs = require('fs-extra');
const path = require('path');
const njk = require('nunjucks');
const express = require('express');
const glob = require('glob');

const FrontMatter = require(path.join(process.cwd(), 'script', 'front-matter.js'));
const git = require(path.join(process.cwd(), 'script', 'git.js'));

const router = express.Router();


function existsID(req, res, next) {

    let collection = {
        dir: path.join(global.source, req.query.id),
        abstract: path.join(global.source, 'abstract', req.query.id + '.md'),
        config: path.join(global.source, req.query.id, req.query.id + '.json')
    };
    let id_is_correct = req.query.id &&
                     fs.existsSync(collection.dir) &&
                     fs.existsSync(collection.abstract) &&
                     fs.existsSync(collection.config);

    res.locals.collection = collection;

    if (req.query.id && id_is_correct) {
        next();
    } else {
        res.type('.txt');
        res.send([
            '=====',
            '',
            'ID: ' + req.query.id,
            '',
            'の小説データは存在しません',
            '',
            '====='
        ].join('\n'));
    }
}

router.use('/', existsID, (req, res, next) => {

    res.locals.collection.data = (new FrontMatter(res.locals.collection.abstract)).attributes

    let collection = res.locals.collection;

    let chapters = [];
    for (let chapter_dir of fs.readdirSync(collection.dir)) {
        let chapter_path = path.join(collection.dir, chapter_dir);
        if (fs.statSync(chapter_path).isDirectory()) {
            let chapter_config_path = path.join(chapter_path, chapter_dir + '.json');
            let content = fs.readJsonSync(chapter_config_path);

            let sections = [];
            for (let section_dir of fs.readdirSync(chapter_path)) {
                let section_path = path.join(chapter_path, section_dir);
                if (fs.statSync(section_path).isDirectory()) {
                    let section_config_path = path.join(section_path, section_dir + '.json');
                    let content = fs.readJsonSync(section_config_path);

                    let stories = [];
                    for (let story_path of glob.sync(path.join(section_path, 'story-*.md'))) {
                        //let story_path = path.join(_path, section_dir);
                        //console.log('[glob] ' + story_path);
                        if (fs.statSync(story_path).isFile()) {
                            let content = new FrontMatter(story_path);

                            stories.push(content);
                        }
                    }

                    stories.sort((a, b) => a.story - b.story);

                    content.child = stories;
                    content.path = section_config_path;
                    sections.push(content);
                }
            }

            sections.sort((a, b) => a.section - b.section);

            content.child = sections;
            content.path = chapter_config_path;
            chapters.push(content);
        }
    }
    chapters.sort((a, b) => a.chapter - b.chapter);

    res.locals.chapters = chapters;

    next();
});

module.exports = router;
