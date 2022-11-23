
console.log('[' + __filename + '] Node.js version: ' + process.version);

/* モジュール */
const electron = require('electron');
const fs = require('fs-extra');
const path = require('path');
const njk = require('nunjucks');
const express = require('express');
const glob = require('glob');
const os = require('os');
const hljs = require('highlight.js');
const child_process = require('child_process')

const Eleventy = require("@11ty/eleventy");

/* 自作モジュール */
const FrontMatter = require('./script/front-matter.js');
const git = require('./script/git.js');
const tree = require('./script/tree.js');
const find_empty_port = require('./script/port.js');

/* 自作ルーター */
const structure = require('./script/routes/structure.js');
const create = require('./script/routes/create.js');


let app = express();





global.source = '';
global.collection = '';

function set_collection_id(req, res, next) {
    if (req.query.hasOwnProperty('id')) {
        global.collection = req.query.id;
    }

    next();
}

app.get('/init/', async (req, res) => {

    let xdg_data_home = path.join(process.env.HOME, '.local', 'share');
    if (process.env.hasOwnProperty('XDG_DATA_HOME') && process.env.XDG_DATA_HOME.length > 0) {
        console.log('Exist XDG_DATA_HOME env');
        xdg_data_home = process.env.XDG_DATA_HOME;
    }

    let xdg_config_home = path.join(process.env.HOME, '.config');
    if (process.env.hasOwnProperty('XDG_CONFIG_HOME') && process.env.XDG_CONFIG_HOME.length > 0) {
        console.log('Exist XDG_CONFIG_HOME env');
        xdg_config_home = process.env.XDG_CONFIG_HOME;
    }

    if (req.query.hasOwnProperty('select') && req.query.select.length > 0) {

        let repos = [];
        let repo_home = path.join(xdg_data_home, 'novel-site-generator', 'data');
        if (!fs.existsSync(repo_home)) {
            fs.mkdirsSync(repo_home);
        } else {
            for (let repo of fs.readdirSync(repo_home)) {
                let repo_dir = path.join(repo_home, repo);
                if (fs.statSync(repo_dir).isDirectory()) {
                    repos.push({
                        dir: repo_dir,
                        name: repo
                    });
                }
            }
        }


        let html = njk.render('.template/init/index.njk', {
            repos: repos,
            repo_home: repo_home
        });
        res.type('.html');
        res.send(html);

    } else if (req.query.hasOwnProperty('repo') && req.query.repo.length > 0) {

        global.source = path.join(xdg_data_home, 'novel-site-generator', 'data', req.query.repo);
        console.log('[src] ' + global.source);

        if (!fs.existsSync(global.source)) {
            console.log('Create: ' + global.source);
            fs.copySync(path.join(__dirname, '.init'), global.source);


            let site_conf_file = path.join(global.source, '_data', 'site.json');

            console.log('Create: ' + site_conf_file);
            let user = path.parse(process.env.HOME).base;
            let content = njk.render(path.join(__dirname, '.template', 'novel', '_data', 'site.json.njk'), {
                title: user + ' の小説サイト',
                user: {
                    author: user,
                    email: user + '@example.com'
                },
                year: (new Date()).getFullYear()
            });
            fs.outputFileSync(site_conf_file, content);


            let site_config;
            try {
                site_config = fs.readJsonSync(site_conf_file);
            } catch (__) {
                console.error('File does not exist: ' + site_conf_file);
                site_config = {};
            }


            await git.init(global.source);
            if (site_config.hasOwnProperty('author') && site_config.author.length > 0) {
                await git.config(global.source, 'user.name', site_config.author);
            }
            if (site_config.hasOwnProperty('email') && site_config.email.length > 0) {
                await git.config(global.source, 'user.email', site_config.email);
            }
            await git.add(global.source);
            await git.commit(
                global.source,
                global.source + ' の作成'
            );
        } else {

            let site_config;
            try {
                site_config = fs.readJsonSync(path.join(global.source, '_data', 'site.json'));
            } catch (__) {
                console.error('File does not exist: ' + path.join(global.source, '_data', 'site.json'));
                site_config = {};
            }

            if (site_config.hasOwnProperty('author') && site_config.author.length > 0) {
                await git.config(global.source, 'user.name', site_config.author);
            }
            if (site_config.hasOwnProperty('email') && site_config.email.length > 0) {
                await git.config(global.source, 'user.email', site_config.email);
            }

        }

        res.type('.html');
        res.redirect('/config/');

    } else {
        res.type('.txt');
        res.send('no repo');

    }
});

function source_is_set(req, res, next) {
    if (global.hasOwnProperty('source') && global.source.length > 0) {
        next();
    } else {
        res.type('.html');
        res.redirect('/init/?select=true');
    }
}


app.get('/config/sort', source_is_set, structure, (req, res) => {
    let html = njk.render('./.template/config/sort/index.njk', {
        chapters: res.locals.chapters,
        id: req.query.id,
        repo: global.source
    });
    res.type('.html');
    res.send(html);
});

function gen_random(num) {
    let S = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let N = num;
    return Array.from(Array(N)).map(() => S[Math.floor(Math.random() * S.length)]).join('');
}

app.use('/config/sort/save/', express.json());
app.post('/config/sort/save/', source_is_set, async (req, res) => {
    console.log('POST: ' + req.query.id);

    let archive_home = path.join(path.parse(path.parse(global.source).dir).dir, 'archive');
    if (!fs.existsSync(archive_home) || !fs.statSync(archive_home).isDirectory()) {
        fs.mkdirsSync(archive_home);
    }

    let date = new Date();
    let archive_dir = path.join(
        archive_home,
        'archive-' + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '-' + gen_random(6)
    )
    fs.mkdirsSync(archive_dir);
    fs.moveSync(path.join(global.source, req.query.id), path.join(archive_dir, req.query.id));


    let command = {
        add: null,
        commit: null,
        success: false
    };
    command.add = await git.add(path.join(global.source));
    //console.log(command.add);
    command.commit = await git.commit(
        global.source,
        'ソート: ' + 'ファイル移動: ' + path.join(global.source, req.query.id) +
        ' -> ' + path.join(archive_dir, req.query.id)

    );
    command.success = command.add.success && command.commit.success;

    if (!command.success) {
        fs.copySync(path.join(archive_dir, req.query.id), path.join(global.source, req.query.id));

        res.type(".json");
        res.send({ redirection: false });
    } else {
        //fs.mkdirSync(path.join('src', req.query.id));
        let n = 1;
        let new_chapters = [];
        for (let chapter of req.body) {
            new_chapters.push(chapter.chapter_title);

            let new_chapter_dir = 'chapter-' + ('0000' + n).slice(-4);
            let new_chapter_path = path.join(global.source, req.query.id, new_chapter_dir);
            let content = fs.readJsonSync(path.join(archive_dir, path.relative(global.source, chapter.path)));
            content = Object.assign(content, { chapter: chapter.chapter });
            fs.outputJsonSync(
                path.join(new_chapter_path, new_chapter_dir + '.json'),
                content
            );

            let j = 1;
            let new_sections = [];
            for (let section of chapter.child) {
                new_sections.push(section.section_title);

                let new_section_dir = 'section-' + ('0000' + j).slice(-4);
                let new_section_path = path.join(new_chapter_path, new_section_dir);
                let content = fs.readJsonSync(path.join(archive_dir, path.relative(global.source, section.path)));
                content = Object.assign(content, { section: section.section });
                fs.outputJsonSync(
                    path.join(new_section_path, new_section_dir + '.json'),
                    content
                );

                let k = 1;
                for (let story of section.child) {
                    let new_story_file = 'story-' + ('0000' + k).slice(-4) + '.md';
                    let new_story_path = path.join(new_section_path, new_story_file);

                    let new_story_data = new FrontMatter(path.join(archive_dir, path.relative(global.source, story.path)));
                    new_story_data.update({ story: story.story });
                    new_story_data.write(new_story_path);

                    k++;
                }

                j++;
            }

            n++;
        }

        fs.copySync(
            path.join(archive_dir, req.query.id, req.query.id + '.json'),
            path.join(global.source, req.query.id, req.query.id + '.json')
        );

        await git.add(path.join(global.source));
        await git.commit(
            global.source,
            'ソート: ' + '書き込み: ' + path.join(global.source, req.query.id)
        );

        res.type('.json');
        res.send({ redirection: true });
    }
});



app.get('/config/add', source_is_set, set_collection_id, structure, (req, res) => {
    let html = njk.render('./.template/config/add/index.njk', {
        chapters: res.locals.chapters,
        id: req.query.id,
        collection: res.locals.collection.data,
        abstract: res.locals.collection.abstract,
        repo: global.source
    });
    res.type('.html');
    res.send(html);
});


app.use('/config/add/create/', express.json());
app.post('/config/add/create/', source_is_set, create, async (req, res) => {

    await git.add(path.join(global.source));
    await git.commit(
        global.source,
        res.locals.create + ' を作成'
    );

    res.type('.json');
    res.send({ redirection: true });
});


app.use('/config/add/remove/', express.json());
app.post('/config/add/remove/', source_is_set, async (req, res) => {

    let removed = req.body.path;

    let archive_home = path.join(path.parse(path.parse(global.source).dir).dir, 'archive')
    if (!fs.existsSync(archive_home) || !fs.statSync(archive_home).isDirectory()) {
        fs.mkdirsSync(archive_home);
    }

    let date = new Date();
    let archive_dir = path.join(
        archive_home,
        'archive-' + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '-' + gen_random(6)
    )
    fs.mkdirSync(archive_dir);

    if (req.body.mode == 'story') {
        console.log('Remove: ' + removed);
        fs.moveSync(removed, path.join(archive_dir, path.relative(global.source, removed)));
    } else if (req.body.mode == 'chapter' || req.body.mode == 'section') {
        removed = path.parse(req.body.path).dir;

        console.log('Remove: ' + removed);
        fs.moveSync(removed, path.join(archive_dir, path.relative(global.source, removed)));
    } else if (req.body.mode == 'collection') {
        removed = [
            req.body.path,
            path.join(global.source, path.parse(req.body.path).name)
        ];

        for (let item of removed) {
            console.log('Remove: ' + item);
            fs.moveSync(item, path.join(archive_dir, path.relative(global.source, item)));
        }

        removed = removed.join(',');
    }

    await git.add(path.join(global.source));
    await git.commit(
        global.source,
        removed + ' を削除'
    );

    if (req.body.mode == 'collection') {
        res.type('.json');
        res.send({ reload: false, back: true });
    } else {
        res.type('.json');
        res.send({ reload: true, back: false });
    }
});

app.use('/config/add/rename/', express.json());
app.post('/config/add/rename/', source_is_set, async (req, res) => {

    let renamed = req.body.path;

    if (req.body.mode == 'story') {
        console.log('Rename: ' + renamed);
        let file = new FrontMatter(renamed);
        file.update({ title: req.body.title });
        file.write(renamed);
    } else if (req.body.mode == 'chapter' || req.body.mode == 'section') {
        console.log('Rename: ' + renamed);
        let file = fs.readJsonSync(renamed);
        file[req.body.mode + '_title'] = req.body.title;
        fs.outputJsonSync(renamed, file);
    }

    await git.add(path.join(global.source));
    await git.commit(
        global.source,
        renamed + ' のタイトルを変更'
    );

    res.type('.json');
    res.send({ redirection: true });
});





app.use('/config/change-id/', express.json());
app.post('/config/change-id/', source_is_set, async (req, res) => {
    let used_id = false;
    for (let dir of fs.readdirSync(global.source)) {
        if (!used_id) {
            used_id = (dir == req.body.new_id);
        }
    }

    if (!used_id) {
        let config_file = path.join(global.source, req.query.id, req.query.id + '.json');
        let config_data = fs.readJsonSync(config_file);

        console.log('Updated: ' + config_file);
        fs.outputJsonSync(
            config_file,
            Object.assign(config_data, { tags: req.body.new_id })
        );

        console.log('Renamed: ' + config_file + ' -> ' + path.join(global.source, req.query.id, req.body.new_id + '.json'));
        fs.renameSync(
            config_file,
            path.join(global.source, req.query.id, req.body.new_id + '.json')
        );

        console.log('Renamed: ' + path.join(global.source, req.query.id) + ' -> ' + path.join(global.source, req.body.new_id));
        fs.renameSync(
            path.join(global.source, req.query.id),
            path.join(global.source, req.body.new_id)
        );

        console.log('Renamed: ' + path.join(global.source, 'abstract', req.query.id + '.md') + ' -> ' + path.join(global.source, 'abstract', req.body.new_id + '.md'));
        fs.renameSync(
            path.join(global.source, 'abstract', req.query.id + '.md'),
            path.join(global.source, 'abstract', req.body.new_id + '.md')
        );
    }


    await git.add(path.join(global.source));
    await git.commit(
        global.source,
        '小説 ID の変更: ' + req.query.id + ' -> ' + req.body.new_id
    );

    if (!used_id) {
        res.type('.json');
        res.send({ redirection: true, new_id: req.body.new_id });
    } else {
        res.type('.json');
        res.send({ redirection: false });
    }
});




app.get('/config', source_is_set, async (req, res) => {
    let collections = [];
    for (let collection of fs.readdirSync(global.source)) {
        let exist_collection = fs.existsSync(path.join(global.source, collection, collection + '.json')) &&
                               fs.readJsonSync(path.join(global.source, collection, collection + '.json')).tags == collection &&
                               fs.existsSync(path.join(global.source, 'abstract', collection + '.md'));

        if (exist_collection) {
            collections.push({
                id: collection,
                data: new FrontMatter(path.join(global.source, 'abstract', collection + '.md'))
            });
        }
    }

    let shorts = [];
    for (let short of fs.readdirSync(path.join(global.source, 'short'))) {
        let exist_short = fs.existsSync(path.join(global.source, 'short', short)) &&
                          fs.existsSync(path.join(global.source, 'short_abstract', short)) &&
                          short != '.DS_Store';

        if (exist_short) {
            shorts.push({
                id: path.parse(short).name,
                data: new FrontMatter(path.join(global.source, 'short', short)),
                path: {
                    main: path.join(global.source, 'short', short),
                    abstract: path.join(global.source, 'short_abstract', short)
                }
            });
        }
    }

    let html = njk.render(
        './.template/config/index.njk',
        {
            collections: collections,
            shorts: shorts,
            repo: global.source
        }
    );
    res.type('.html');
    res.send(html);
});


app.use('/config/new/', express.json());
app.post('/config/new/', source_is_set, async (req, res) => {
    let used_id = false;

    if (req.body.mode == 'long') {
        for (let dir of fs.readdirSync(global.source)) {
            if (!used_id) {
                used_id = (dir == req.body.new_id);
            }
        }
    } else if (req.body.mode == 'short') {
        for (let file of fs.readdirSync(path.join(global.source, 'short'))) {
            if (!used_id) {
                used_id = (path.parse(file).name == req.body.new_id);
            }
        }
    }


    if (!used_id && req.body.mode == 'long') {
        let config = {
            dir: path.join(global.source, req.body.new_id),
            abstract: path.join(global.source, 'abstract', req.body.new_id + '.md'),
            file: path.join(global.source, req.body.new_id, req.body.new_id + '.json')
        }

        console.log('Create: ' + config.file);
        fs.outputJsonSync(config.file, {
            layout: "novel_story_long.njk",
            tags: req.body.new_id
        });

        console.log('Create: ' + config.abstract);
        let content = [
            '---',
            'permalink: "/{{ path.parse(page.inputPath).name }}/index.html"',
            '',
            'title: "新しい小説"',
            'author: "新しい小説の作者"',
            '',
            'r18: false',
            '',
            'publish: false # 公開時は true',
            'license: false # BY,BY-SA,BY-NC,BY-ND,BY-NC-SA,BY-NC-ND 等を選択',
            '---',
            '',
            '<!--- ここから本文 --->',
            ''
        ].join('\n');
        fs.outputFileSync(config.abstract, content);


        let chapter_path = path.join(config.dir, 'chapter-0001', 'chapter-0001.json')
        console.log('Create: ', chapter_path);
        fs.outputJsonSync(chapter_path, {
            chapter: 1,
            chapter_title: "新しいチャプター"
        });

        let section_path = path.join(config.dir, 'chapter-0001', 'section-0001', 'section-0001.json');
        console.log('Create: ', section_path);
        fs.outputJsonSync(section_path, {
            section: 1,
            section_title: "新しいセクション"
        });

        let story_content = [
            '---',
            'title: "新ストーリー"',
            'story: 1',
            'publish: false',
            '---',
            '',
            '<!--- ここから本文 --->'
        ].join('\n');
        let story_path = path.join(config.dir, 'chapter-0001', 'section-0001', 'story-0001.md')
        console.log('Create: ', story_path);
        fs.outputFileSync(story_path, story_content);

    } else if (!used_id && req.body.mode == 'short') {

        let config = {
            abstract: path.join(global.source, 'short_abstract', req.body.new_id + '.md'),
            file: path.join(global.source, 'short', req.body.new_id + '.md')
        }

        console.log('Create: ' + config.file);
        let content = [
            '---',
            'title: "新しい小説"',
            'author: "新しい小説の作者"',
            '',
            'r18: false',
            '',
            'publish: false # 公開時は true',
            'license: false # BY,BY-SA,BY-NC,BY-ND,BY-NC-SA,BY-NC-ND 等を選択',
            '---',
            '',
            '<!--- ここから本文 --->',
            ''
        ].join('\n');
        fs.outputFileSync(config.file, content);

        console.log('Create: ' + config.abstract);
        let abstract_content = [
            '',
            '<!--- ここから本文（あらすじ） --->',
            ''
        ].join('\n');
        fs.outputFileSync(config.abstract, abstract_content);

    }


    await git.add(path.join(global.source));
    await git.commit(
        global.source,
        '作成: ' + req.body.mode + ' 小説 ID: ' + req.body.new_id
    );

    if (!used_id) {
        res.type('.json');
        res.send({ redirection: true });
    } else {
        res.type('.json');
        res.send({ redirection: false });
    }
});


app.use('/config/short/change-id/', express.json());
app.post('/config/short/change-id/', source_is_set, async (req, res) => {
    let used_id = false;

    for (let file of fs.readdirSync(path.join(global.source, 'short'))) {
        if (!used_id) {
            used_id = (path.parse(file).name == req.body.id.new);
        }
    }


    if (!used_id) {
        let file = {
            old: path.join(global.source, 'short', req.body.id.old + '.md'),
            new: path.join(global.source, 'short', req.body.id.new + '.md')
        }
        let abstract = {
            old: path.join(global.source, 'short_abstract', req.body.id.old + '.md'),
            new: path.join(global.source, 'short_abstract', req.body.id.new + '.md')
        }

        console.log('Renamed: ' + file.old + ' -> ' + file.new);
        fs.renameSync(file.old, file.new);

        console.log('Renamed: ' + abstract.old + ' -> ' + abstract.new);
        fs.renameSync(abstract.old, abstract.new);
    }


    await git.add(path.join(global.source));
    await git.commit(
        global.source,
        '短編小説 ID の変更: ' + req.body.id.old + ' -> ' + req.body.id.new
    );

    if (!used_id) {
        res.type('.json');
        res.send({ redirection: true });
    } else {
        res.type('.json');
        res.send({ redirection: false });
    }
});



app.use('/config/clean-all/', express.json());
app.post('/config/clean-all/', source_is_set, (req, res) => {
    let archive_home = path.join(path.parse(path.parse(global.source).dir).dir, 'archive')
    if (!fs.existsSync(archive_home) || !fs.statSync(archive_home).isDirectory()) {
        fs.mkdirsSync(archive_home);
    }

    for (let dir of fs.readdirSync(archive_home)) {
        console.log('Remove: ' + path.join(archive_home, dir));
        fs.removeSync(path.join(archive_home, dir));
    }

    res.type('.json');
    res.send({ redirection: true });
});





function createWindow(url, maximize, devtools) {
    // ブラウザウインドウを作成します。
    const mainWindow = new electron.BrowserWindow({
        width: 800,
        height: 600,
        title: "Novel Site Generator"
    });


    /*
    const view_2 = new electron.BrowserView();
    mainWindow.setBrowserView(view_2);
    view_2.setBounds({ x: 0, y: 0, width: 400, height: 600 });
    view_2.setAutoResize({
        horizontal: true,
        vertical: true
    });
    view_2.webContents.loadURL('https://electronjs.org');


    const view = new electron.BrowserView();
    mainWindow.setBrowserView(view);
    view.setBounds({ x: 400, y: 0, width: 400, height: 600 });
    view.setAutoResize({
        horizontal: true,
        height: true
    });
    view.webContents.loadURL('https://electronjs.org');
    */


    // そしてアプリの index.html を読み込みます。
    mainWindow.loadURL(url);
    if (maximize) {
        mainWindow.maximize();
    }


    // デベロッパー ツールを開きます。
    if (devtools) {
        mainWindow.webContents.openDevTools({ mode: "right" });
    }

    return mainWindow;
}

// このメソッドは、Electron の初期化が完了し、
// ブラウザウインドウの作成準備ができたときに呼ばれます。
// 一部のAPIはこのイベントが発生した後にのみ利用できます。
electron.app.enableSandbox();

electron.app.setAboutPanelOptions({
    applicationName: 'Novel Site Generator',
    applicationVersion: '0.0.1',
    copyright: 'copyright (c) 2022 M4K-15Y-6666-FK'
});
electron.app.setName('Novel Site Generator');

global.initialPort = 8080;
electron.app.whenReady()
.then(find_empty_port)
.then(port => {
    global.initialPort = port;
    return new Promise((resolve) => {
        app.listen(port, _ => {
            console.log('[init] Access: http://localhost:' + port + '/');
            resolve(port);
        });
    });
})
.then(port => {
    createWindow('http://localhost:' + port + '/init/?select=true', true, true);

    electron.app.on('activate', () => {
        // macOS では、Dock アイコンのクリック時に他に開いているウインドウがない
        // 場合、アプリのウインドウを再作成するのが一般的です。
        if (electron.BrowserWindow.getAllWindows().length === 0) {
            createWindow('http://localhost:' + port + '/init/?select=true', true, true);
        }
    });
});

// macOS を除き、全ウインドウが閉じられたときに終了します。 ユーザーが
// Cmd + Q で明示的に終了するまで、アプリケーションとそのメニューバーを
// アクティブにするのが一般的です。
electron.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') electron.app.quit()
});



global.server = {};

app.get('/config/render/', source_is_set, async (req, res) => {
    //console.log(electron.app.getPath('documents'));

    let save_path = electron.dialog.showSaveDialogSync({
        defaultPath: path.join(electron.app.getPath('documents'), 'novel-' + gen_random(6)),
        properties: [
            'createDirectory'
        ]
    });

    if (!save_path) {
        res.type('.html');
        res.redirect('/config/');
    } else {
        if (fs.existsSync(save_path)) {
            fs.removeSync(save_path);
        }
        fs.mkdirsSync(save_path);


        let render = path.join(__dirname, '.render');
        if (!fs.existsSync(render)) {
            fs.mkdirsSync(render);
        }
        for (let dir of fs.readdirSync(render)) {
            fs.removeSync(path.join(render, dir));
        }

        let temp_dir = path.join(__dirname, '.render', 'cache-' + gen_random(6));
        fs.mkdirsSync(temp_dir);
        for (let dir of fs.readdirSync(global.source)) {
            if (dir != '.git') {
                fs.copySync(path.join(global.source, dir), path.join(temp_dir, dir));
            }
        }

        /*
        let elev = new Eleventy(temp_dir, save_path, {
            quietMode: true,
            configPath: path.join(__dirname, ".eleventy.js")
        });


        */

        let site_data = { prefix: '' };
        for (let dir of glob.sync(path.join(__dirname, '.render', 'cache-*', '_data', 'site.json'))) {
            site_data = fs.readJsonSync(dir);
        }
        if (site_data.prefix[0] == '/') {
            site_data.prefix = site_data.prefix.slice(1);
        }
        if (site_data.prefix[site_data.prefix.length - 1] == '/') {
            site_data.prefix = site_data.prefix.slice(0, -1);
        }

        /*
        let elev = child_process.spawnSync(path.join(__dirname, 'node_modules', '.bin', 'eleventy'), [
            '--input=' + temp_dir,
            '--output=' + save_path,
            '--config=' + path.join(__dirname, '.eleventy.js'),
            '--pathprefix=' + site_data.prefix,
            '--quiet',
            '--to=json'
        ], {
            cwd: __dirname
        });
        */
        const render_11ty = require('./script/eleventy.js');

        let elev = await render_11ty({
            input: temp_dir,
            output: save_path,
            config: path.join(__dirname, '.eleventy.js'),
            prefix: site_data.prefix,
            cwd: __dirname
        });

        let json = JSON.parse(elev);
        for (let obj of json) {
            fs.outputFileSync(obj.outputPath, obj.content);
        }

        let img_dir = path.join(temp_dir, 'assets', 'img');
        for (let img of glob.sync(path.join(img_dir, '**/*'))) {
            fs.copySync(img, path.join(save_path, 'assets', 'img', path.relative(img_dir, img)));
        }

        fs.copySync(save_path, path.join(render, 'output'));


        try {
            global.server.close();
        } catch(__) {
            console.log('no server');
        }
        let new_app = express();
        let new_port = await find_empty_port();
        global.server = new_app.listen(new_port, _ => {
            console.log('Access to ' + new_port);
        });

        let access_url = '/' + site_data.prefix + '/';
        if (site_data.prefix.length == 0) {
            access_url = '/';
        }
        new_app.use(access_url, express.static(path.join(render, 'output')));

        await electron.app.whenReady();
        await electron.shell.openExternal(
            'http://localhost:' + new_port + access_url,
            { activate: true }
        );

        res.type('.html');
        res.redirect('/config/');
    }

});


const mimetype = require('./script/mimetype.js');

app.get('/config/image/', source_is_set, async (req, res) => {

    let img_file = path.join(global.source, 'assets', 'img', 'upload.json');
    if (!fs.existsSync(img_file)) {
        fs.outputJsonSync(img_file, []);
    }

    let json = fs.readJsonSync(img_file);
    if (!Array.isArray(json)) {
        throw new Error('JSON is not Array.');
    }

    let html = njk.render(path.join(__dirname, '.template', 'config', 'image', 'index.njk'), {
        images: json,
        file: img_file,
        size: (fs.statSync(img_file).size / 1000000).toPrecision(3),
        repo: global.source
    })
    res.type('.html');
    res.send(html);
});

app.use('/config/image/upload/', express.json());
app.post('/config/image/upload/', source_is_set, async (req, res) => {

    let images = electron.dialog.showOpenDialogSync({
        properties: [
            'openFile'
        ]
    });
    let img_file = path.join(global.source, 'assets', 'img', 'upload.json');
    let json = [];
    if (fs.existsSync(img_file)) {
        json = fs.readJsonSync(img_file);
    } else {
        fs.outputJsonSync(img_file, json);
    }

    function random_hash() {
        return ('000000' + Math.floor(Math.random() * ((36 ** 6) - 1)).toString(36)).slice(-6);
    }

    let hash = random_hash();
    while (json.find((item) => item.hash == hash)) {
        hash = random_hash;
    }


    for (let img of images) {
        let data = mimetype(img);
        json.push({
            hash: hash,
            title: path.parse(img).name,
            type: data.type,
            date: (new Date()).toLocaleString(),
            src: 'data:' + data.type + ';base64,' + data.buffer.toString('base64')
        });

        break;
    }
    fs.outputJsonSync(img_file, json);

    await git.add(path.join(global.source));
    await git.commit(
        global.source,
        '画像データの追加：' + images[0]
    );

    res.type('.json');
    res.send({ reload: true });
});

app.use('/config/image/remove/', express.json());
app.post('/config/image/remove/', source_is_set, async (req, res) => {
    let img_file = path.join(global.source, 'assets', 'img', 'upload.json');
    let json = [];
    if (fs.existsSync(img_file)) {
        json = fs.readJsonSync(img_file);
    } else {
        fs.outputJsonSync(img_file, json);
    }

    json = json.filter((item) => item.hash != req.body.hash);
    fs.outputJsonSync(img_file, json);

    await git.add(path.join(global.source));
    await git.commit(
        global.source,
        '画像データの削除：' + req.body.hash
    );

    res.type('.json');
    res.send({ reload: true });
});

app.use('/config/image/rename/', express.json());
app.post('/config/image/rename/', source_is_set, async (req, res) => {
    let img_file = path.join(global.source, 'assets', 'img', 'upload.json');
    let json = [];
    if (fs.existsSync(img_file)) {
        json = fs.readJsonSync(img_file);
    } else {
        fs.outputJsonSync(img_file, json);
    }

    let change = json.find((item) => item.hash == req.body.hash);

    json = json.filter((item) => item.hash != req.body.hash);
    json.push(
        Object.assign(change, { title: req.body.title, date: (new Date()).toLocaleString() })
    )
    fs.outputJsonSync(img_file, json);

    await git.add(path.join(global.source));
    await git.commit(
        global.source,
        '画像データの更新：' + req.body.hash + ': ' + change.title
    );

    res.type('.json');
    res.send({ reload: true });
});



app.get('/version/', source_is_set, async (req, res) => {
    let hash = git.sync.logOnlyShortHash(global.source).stdout.toString().split('\n');
    let log = git.sync.log(global.source).stdout.toString().split('\n');

    let logs = [];
    for (let line of log) {
        if (line.indexOf('|') >= 0) {
            let splited = line.split('|');
            logs.push({
                hash: splited[0],
                date: splited[1],
                subject: splited.slice(2).join('|')
            });
        } else {
            logs.push({
                hash: line,
                date: '',
                subject: ''
            });
        }
    }

    let html = njk.render(path.join(__dirname, '.template', 'version', 'index.njk'), {
        logs: logs,
        hash: hash,
        repo: global.source
    })
    res.type('.html');
    res.send(html);
});



app.use('/version/revert/', express.json());
app.post('/version/revert/', source_is_set, async (req, res) => {
    await git.revert(global.source, req.body.hash);
    await git.commit(
        global.source,
        req.body.hash + ' の時点まで戻した'
    );

    res.type('.json');
    res.send({ reload: true });
});








let tmpdir = path.join(__dirname, '.editor');
if (!fs.existsSync(tmpdir)) {
    fs.mkdirsSync(tmpdir);
}
for (let dir of fs.readdirSync(tmpdir)) {
    fs.removeSync(path.join(tmpdir, dir));
}

const script_tmp_dir = path.join(tmpdir, 'cache-' + gen_random(6));
if (!fs.existsSync(script_tmp_dir)) {
    fs.mkdirsSync(script_tmp_dir);
}
console.log('[init editor] Create: ' + script_tmp_dir);
//for (let file of fs.readdirSync('.tmp')) {
//    let remove_file = '.tmp/' + file
//    if (fs.existsSync(remove_file)) {
//
//        fsex.removeSync(remove_file);
//    }
//}
//if (!fs.existsSync('.tmp/output')) {
//    console.log('[init] Create: .tmp/output');
//    fs.mkdirSync('.tmp/output');
//}

/* 3. 以後、アプリケーション固有の処理 */
function allow_access(access, xpath) {
    let url = access;
    if (url[0] != '/') {
        url = '/' + url;
    }
    if (url[url.length - 1] == '/') {
        url = url.slice(0, url.length - 1);
    }

    let absolute_path = xpath;

    if (absolute_path[absolute_path.length - 1] == '/') {
        absolute_path = absolute_path.slice(0, absolute_path.length - 1);
    }

    if (fs.existsSync(absolute_path)) {
        console.log('[init] Access allowed: ' + absolute_path + ' to ' + url);
        app.use(url, express.static(absolute_path));
    } else {
        console.log('[init] Warning: not exist path: ' + absolute_path);
    }
}

allow_access('/modules', path.join(__dirname, 'node_modules'));
allow_access('/assets', path.join(__dirname, '.template', 'edit', 'assets'));


function fix_url(req, res, next) {
    let url = req.originalUrl;
    if (url[0] == '/') {
        url = url.slice(1);
    }
    if (url.slice(0,5) == 'save/') {
        url = url.slice(5, url.length);
    }
    if (url.slice(0,5) == 'edit/') {
        url = url.slice(5, url.length);
    }


    let file = path.resolve(path.sep, url);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.type('.txt');
        res.send('no data');
    } else {
        if (path.parse(file).base == 'site.json') {
            res.locals.fixed_url = file;
            next();
        } else if (path.parse(file).ext == '.md') {
            res.locals.fixed_url = file;
            next();
        } else  {
            res.type('.txt');
            res.send('cant access');
        }
    }
}

function send_top_page(req, res) {
    let file_path = res.locals.fixed_url;

    let file_content;
    let file_status
    if (fs.existsSync(file_path) && fs.statSync(file_path).isFile()) {
        console.log('Open File: ' + file_path);
        file_content = fs.readFileSync(file_path);

        file_status = fs.statSync(file_path);
    } else {
        console.log('Warning: unknown file: ' + file_path);
        /*
        file_content = [
            '---',
            'title: "ここにタイトルを書く"',
            '---',
            '',
            'ここに本文を書く。'
        ].join("\n");

        let date = new Date();
        file_status = {
            mtime: date,
            birthtime: date
        }
        */
        res.type('.html');
        res.redirect('/config/');
    }

    let editor_lang = 'markdown';
    if (path.parse(file_path).base == 'site.json') {
        editor_lang = 'json'
    }
    let html = njk.render(path.join(__dirname, '.template', 'edit', 'index.njk'), {
        editor_lang: editor_lang,
        id: global.collection,
        file_path: file_path,
        file_content: file_content.toString(),
        file_tree: tree(),
        random_id: gen_random(6),
        information: [
            '<dl class="uk-description-list uk-description-list-divider">',
            '<dt>app working directory</dt>',
            '<dd>' + __dirname + '</dd>',
            '<dt>source repository</dt>',
            '<dd>' + global.source + '</dd>',
            '<dt>file path</dt>',
            '<dd>' + file_path + '</dd>',
            '<dt>date: last modified</dt>',
            '<dd>' + file_status.mtime.toLocaleString() + '</dd>',
            '<dt>date: created</dt>',
            '<dd>' + file_status.birthtime.toLocaleString() + '</dd>',
            '</dl>',
        ].join('\n'),
    });
    res.type('.html');
    res.send(html);
}

//app.post('/', function(req, res) {
//    console.log('POST!');
//    res.send('POST is sended.');
//});

//app.get('/edit', send_top_page);
//app.get(/\/edit.+/, send_top_page);
app.use('/edit/', fix_url, send_top_page);

let backup = {};
app.use('/render', express.json());
app.post('/render',  async (req, res) => {
    //console.log(req.body);
    let content = req.body.content;
    let date = Date.now();
    //console.log('name->' + content);

    let browser_id;
    if (req.body.id.length > 0) {
        browser_id = req.body.id;
    } else {
        browser_id = "default-id";
    }
    console.log('POST from ID: ' + req.body.id);

    //console.log(fs.readdirSync('read'));
    //console.log(fs.existsSync('read/' + fs.readdirSync('read')[0]));
    let tmp_dir = path.join(script_tmp_dir, 'input-' + browser_id + '-' + gen_random(6));

    console.log('Create: ' + tmp_dir);
    for (let dir of fs.readdirSync(global.source)) {
        if (dir != '.git') {
            fs.copySync(path.join(global.source, dir), path.join(tmp_dir, dir));
        }
    }

    //for (let file of fs.readdirSync(tmp_dir)) {
    //    let remove_file = p.join(tmp_dir, file)
    //    if (fs.existsSync(remove_file)) {
    //        console.log('Remove: ' + remove_file);
    //        fsex.removeSync(remove_file);
    //    }
    //}

    let pathname = req.body.path;
    //console.log(pathname);
    if (pathname[0] == '/') {
        pathname = pathname.slice(1);
    }
    if (pathname.slice(0,5) == 'edit/') {
        pathname = pathname.slice(5);
    }
    let input_path = path.join(tmp_dir, path.relative(global.source, '/' + pathname));
    console.log('Write: ' + input_path);
    fs.writeFileSync(input_path, content);

    //fs.unlinkSync('tmp/xxx/index.html');
    //if (!fs.existsSync('.tmp/output')) {
    //    console.log('Create: .tmp/output');
    //    fs.mkdirSync('.tmp/output');
    //}
    let output_dir = path.join(script_tmp_dir, "output");
    fs.removeSync(output_dir);
    fs.mkdirsSync(output_dir);
    let elev = new Eleventy(tmp_dir, output_dir, {
        quietMode: true,
        configPath: path.join(__dirname, ".editor.eleventy.js")
    });

    let result = {
        success: true,
        url: '/'
    };
    try {
        let json = await elev.toJSON();

        for (let obj of json) {
            fs.outputFileSync(obj.outputPath, obj.content);
            //console.log(obj.inputPath);
            //console.log(input_path);
            if (obj.inputPath == input_path) {
                result = Object.assign(result, obj);
                //result.url = '/public' + result.url;
                backup[browser_id] = obj;
            }
        }

        let img_dir = path.join(tmp_dir, 'assets', 'img');
        for (let img of glob.sync(path.join(img_dir, '**/*'))) {
            fs.copySync(img, path.join(output_dir, 'assets', 'img', path.relative(img_dir, img)));
        }
    } catch(error) {
        console.error(error);
        if (backup.hasOwnProperty(browser_id) && backup[browser_id].hasOwnProperty("content")) {
            result = Object.assign(result, backup[browser_id]);
        } else {
            result = Object.assign(result, {
                content: 'NO BACKUPS!'
            });
        }
        result.success = false;
    }

    res.send(result);
    //const html = fs.readFileSync('tmp/' + date + '/index.html');
    //res.send(result);
});

app.use('/public', express.static(path.join(script_tmp_dir, 'output')));

app.use('/save/', express.text());
app.use('/save/', fix_url, async (req, res) => {
    let url = res.locals.fixed_url.split('/');
    let file_path = path.join(path.sep, ...url);


    let result = {
        success: true,
        content: file_path
    };
    try {
        fs.outputFileSync(file_path, req.body);
        console.log('編集: 更新: ' + file_path);
    } catch(err) {
        console.error(err);

        result.success = false;
    }

    await git.add(global.source);
    await git.commit(
        global.source,
        file_path + ' の内容を更新'
    );

    res.type('.json');
    res.send(result);

});

global.imageWindow = false;
app.use('/new-window/', express.text());
app.post('/new-window/', source_is_set, async (req, res) => {
    if (!global.imageWindow) {
        let win = createWindow('http://localhost:' + global.initialPort + req.body, false, true);
        global.imageWindow = true;
        win.on('closed', _ => {
            global.imageWindow = false;
        });
    }

    res.type('.json');
    res.send({ reload: false });
});
