
console.log('[' + __filename + '] Node.js version: ' + process.version);

/* モジュール */
const electron = require('electron');
const fs = require('fs-extra');
const path = require('path');
const njk = require('nunjucks');
const express = require('express');
const glob = require('glob');
const os = require('os');
const hljs = require('highlight.js')

const Eleventy = require("@11ty/eleventy");

/* 自作モジュール */
const FrontMatter = require('./script/front-matter.js');
const git = require('./script/git.js');

/* 自作ルーター */
const structure = require('./script/routes/structure.js');
const create = require('./script/routes/create.js')


let app = express();

let port = 8080;
app.listen(port, _ => {
    console.log('[init] Access: http://localhost:' + port + '/');
});



global.source = '';

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

        if (repos.length === 0) {
            console.log('No repositories');
            let conf_home = path.join(xdg_config_home, 'novel-site-generator');
            if (!fs.existsSync(conf_home)) {
                console.log('Create: ' + conf_home);
                fs.mkdirsSync(conf_home);
            }

            let conf_file = path.join(conf_home, 'config.json');
            if (!fs.existsSync(conf_file)) {
                console.log('Create: ' + conf_file);
                let default_user = path.parse(process.env.HOME).base;
                let content = [
                    '{',
                    '    "user": {',
                    '        "name": "' + default_user + '",',
                    '        "email": "' + default_user + '@example.com"',
                    '    }',
                    '}',
                ].join('\n');
                fs.writeFileSync(conf_file, content);
            }
        }

        let html = njk.render('.template/init/index.njk', { repos: repos, home: repo_home });
        res.type('.html');
        res.send(html);

    } else if (req.query.hasOwnProperty('repo') && req.query.repo.length > 0) {

        global.source = path.join(xdg_data_home, 'novel-site-generator', 'data', req.query.repo);
        console.log('[src] ' + global.source);

        if (!fs.existsSync(global.source)) {
            console.log('Create: ' + global.source);
            fs.copySync(path.join(__dirname, '.init'), global.source);

            let date = new Date();
            let novel_config;
            try {
                novel_config = fs.readJsonSync(path.join(xdg_config_home, 'novel-site-generator', 'config.json'));
            } catch (__) {
                console.error('File does not exist: ' + path.join(xdg_config_home, 'novel-site-generator', 'config.json'));
                novel_config = {};
            }

            await git.init(global.source);
            if (novel_config.hasOwnProperty('user')) {
                if (novel_config.user.hasOwnProperty('name') && novel_config.user.name.length > 0) {
                    await git.config(global.source, 'user.name', novel_config.user.name);
                }
                if (novel_config.user.hasOwnProperty('email') && novel_config.user.email.length > 0) {
                    await git.config(global.source, 'user.email', novel_config.user.email);
                }
            }
            await git.add(global.source);
            await git.commit(
                global.source,
                date.toLocaleString() + ' # ' + 'Created: ' + global.source
            );
        }

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
        path.join(global.source),
        date.toLocaleString() + ' # ' +
        'Moved: ' + path.join(global.source, req.query.id) +
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
            path.join(global.source),
            date.toLocaleString() + ' # ' +
            'Updated: ' + path.join(global.source, req.query.id)
        );

        res.type('.json');
        res.send({ redirection: true });
    }
});



app.get('/config/add', source_is_set, structure, (req, res) => {
    let html = njk.render('./.template/config/add/index.njk', {
        chapters: res.locals.chapters,
        id: req.query.id,
        collection: res.locals.collection.data,
        repo: global.source
    });
    res.type('.html');
    res.send(html);
});


app.use('/config/add/create/', express.json());
app.post('/config/add/create/', source_is_set, create, async (req, res) => {
    let date = new Date();

    await git.add(path.join(global.source));
    await git.commit(
        path.join(global.source),
        date.toLocaleString() + ' # ' + 'Created: ' + res.locals.create
    );

    res.type('.json');
    res.send({ redirection: true });
});


app.use('/config/add/remove/', express.json());
app.post('/config/add/remove/', source_is_set, async (req, res) => {

    let removed = req.body.path;


    if (!fs.existsSync('archive') || !fs.statSync('archive').isDirectory()) {
        fs.mkdirSync('archive');
    }

    let date = new Date();
    let archive_dir = path.join(
        'archive',
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
    }

    await git.add(path.join(global.source));
    await git.commit(
        path.join(global.source),
        date.toLocaleString() + ' # ' + 'Removed: ' + removed
    );

    res.type('.json');
    res.send({ redirection: true });
});

app.use('/config/add/rename/', express.json());
app.post('/config/add/rename/', source_is_set, async (req, res) => {

    let renamed = req.body.path;
    let date = new Date();

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
        path.join(global.source),
        date.toLocaleString() + ' # ' + 'Renamed: ' + renamed
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

    let date = new Date();

    await git.add(path.join(global.source));
    await git.commit(
        path.join(global.source),
        date.toLocaleString() + ' # ' + 'Rename ID: ' + req.query.id + ' -> ' + req.body.new_id
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
                    main: path.join('short', short),
                    abstract: path.join('short_abstract', short)
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

    let date = new Date();

    await git.add(path.join(global.source));
    await git.commit(
        path.join(global.source),
        date.toLocaleString() + ' # ' + 'Create: ' + req.body.mode + ' novel ID: ' + req.body.new_id
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


    let date = new Date();

    await git.add(path.join(global.source));
    await git.commit(
        path.join(global.source),
        date.toLocaleString() + ' # ' + 'Rename short novel ID: ' + req.body.id.old + ' -> ' + req.body.id.new
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
        fs.mkdirSync(archive_home);
    }

    for (let dir of fs.readdirSync(archive_home)) {
        console.log('Remove: ' + path.join(archive_home, dir));
        fs.removeSync(path.join(archive_home, dir));
    }

    res.type('.json');
    res.send({ redirection: true });
});





function createWindow() {
  // ブラウザウインドウを作成します。
  const mainWindow = new electron.BrowserWindow({
      title: "Novel Site Generator"
  });

  // そしてアプリの index.html を読み込みます。
  mainWindow.loadURL('http://localhost:8080/init/?select=true');
  mainWindow.maximize();

  // デベロッパー ツールを開きます。
  mainWindow.webContents.openDevTools();
}

// このメソッドは、Electron の初期化が完了し、
// ブラウザウインドウの作成準備ができたときに呼ばれます。
// 一部のAPIはこのイベントが発生した後にのみ利用できます。
electron.app.whenReady().then(() => {
  createWindow();

  electron.app.on('activate', () => {
    // macOS では、Dock アイコンのクリック時に他に開いているウインドウがない
    // 場合、アプリのウインドウを再作成するのが一般的です。
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// macOS を除き、全ウインドウが閉じられたときに終了します。 ユーザーが
// Cmd + Q で明示的に終了するまで、アプリケーションとそのメニューバーを
// アクティブにするのが一般的です。
electron.app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') electron.app.quit()
});

// このファイルでは、アプリ内のとある他のメインプロセスコードを
// インクルードできます。
// 別々のファイルに分割してここで require することもできます。


app.get('/config/render/', source_is_set, async (req, res) => {
    let save_path = electron.dialog.showSaveDialogSync({
        defaultPath: path.join(process.env.HOME, 'Documents', 'novel-' + gen_random(6)),
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
        fs.copySync(global.source, temp_dir);
        let elev = new Eleventy(temp_dir, save_path, {
            quietMode: true,
            configPath: path.join(__dirname, ".eleventy.js")
        });

        let json = await elev.toJSON();

        for (let obj of json) {
            fs.outputFileSync(obj.outputPath, obj.content);
        }

        res.type('.html');
        res.redirect('/config/');
    }

});


app.get('/version/', source_is_set, async (req, res) => {
    let hash = git.sync.logOnlyShortHash(global.source).stdout.toString().split('\n');
    let log = git.sync.log(global.source).stdout.toString().split('\n');

    let logs = [];
    for (let line of log) {
        if (line.indexOf(' ') >= 0) {
            let splited = line.split(' ');
            logs.push({
                hash: splited[0],
                subject: splited.slice(1).join(' ')
            });
        } else {
            logs.push({
                hash: line,
                subject: ''
            });
        }
    }

    let html = njk.render(path.join(__dirname, '.template', 'version', 'index.njk'), {
        logs: logs,
        hash: hash
    })
    res.type('.html');
    res.send(html);
});



app.use('/version/revert/', express.json());
app.post('/version/revert/', source_is_set, async (req, res) => {
    await git.reset(global.source, req.body.hash);

    res.type('.json');
    res.send({ reload: true });
});
