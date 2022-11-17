const fs = require('fs-extra');
const path = require('path');
const njk = require('nunjucks');
const express = require('express');
const glob = require('glob');

const FrontMatter = require(path.join(process.cwd(), 'script', 'front-matter.js'));


function create_new_story(req, res) {
    let dir = path.parse(req.body.path).dir;

    let last_story = 1;
    for (let story_path of glob.sync(path.join(dir, 'story-*.md'))) {
        if (fs.statSync(story_path).isFile()) {
            let story_num = (new FrontMatter(story_path)).attributes.story || 1;
            if (last_story <= story_num) {
                last_story = story_num + 1
            }
        }
    }

    let new_story_file = 'story-' + ('0000' + last_story).slice(-4) + '.md';
    let content = [
        '---',
        'title: ' + req.body.title,
        'story: ' + last_story,
        'publish: false # 公表する場合は "true" に設定',
        '---',
        '<!--- ここから本文 --->',
        ''
    ].join('\n');

    create = path.join(dir, new_story_file);
    console.log('Create: ', create);
    fs.outputFileSync(create, content);

    return create;
}

function create_new_xxx(req, res) {
    let dir = path.normalize(path.join(
        path.parse(req.body.path).dir, '..'
    ));

    let last_xxx = 1;
    for (let xxx_path of glob.sync(path.join(dir, req.body.mode + '-*', req.body.mode + '-*.json'))) {
        if (fs.statSync(xxx_path).isFile()) {
            let json = fs.readJsonSync(xxx_path);
            let xxx_num = json[req.body.mode];
            if (last_xxx <= xxx_num) {
                last_xxx = xxx_num + 1
            }
        }
    }

    let new_xxx_dir = req.body.mode + '-' + ('0000' + last_xxx).slice(-4);
    let content = {};
    content[req.body.mode] = last_xxx;
    content[req.body.mode + '_title'] = req.body.title;
    create = path.join(dir, new_xxx_dir, new_xxx_dir + '.json');
    console.log('Create: ', create);
    fs.outputJsonSync(create, content);

    return create;
}



const router = express.Router();

router.use('/', (req, res, next) => {
    if (req.body.mode == 'story') {
        res.locals.create = create_new_story(req, res);

    } else if (req.body.mode == 'section') {
        res.locals.create = create_new_xxx(req, res);

        let dir = path.parse(res.locals.create).dir;
        let content = [
            '---',
            'title: "新ストーリー"',
            'story: 1',
            'publish: false',
            '---',
            '',
            '<!--- ここから本文 --->'
        ].join('\n');
        console.log('Create: ', path.join(dir, 'story-0001.md'));
        fs.outputFileSync(
            path.join(dir, 'story-0001.md'),
            content
        );
    } else if (req.body.mode == 'chapter') {
        res.locals.create = create_new_xxx(req, res);

        let dir = path.parse(res.locals.create).dir;
        console.log('Create: ', path.join(dir, 'section-0001', 'section-0001.json'));
        fs.outputJsonSync(
            path.join(dir, 'section-0001', 'section-0001.json'),
            {
                section: 1,
                section_title: "新しいセクション"
            }
        );

        let content = [
            '---',
            'title: "新ストーリー"',
            'story: 1',
            'publish: false',
            '---',
            '',
            '<!--- ここから本文 --->'
        ].join('\n');
        console.log('Create: ', path.join(dir, 'section-0001', 'story-0001.md'));
        fs.outputFileSync(
            path.join(dir, 'section-0001', 'story-0001.md'),
            content
        );
    }

    next();
});

module.exports = router;
