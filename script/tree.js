const fs = require('fs');
const path = require('path');

let srcdir = [{
    name: 'src',
    path: 'src',
    isDirectory: true,
    child: [],
}];

let html = ['<ul class="uk-nav-default" uk-nav="multiple: true">'];
let src_include = true;
function gen_file_tree(array) {
    for (let obj of array) {
        if (fs.existsSync(obj.path) && obj.isDirectory) {
            if (src_include) {
                html.push('<li class="uk-parent uk-open">');
                html.push('<a href="#" class="uk-text-primary">' +
                          '<span uk-icon="icon: folder; ratio: 1;"></span>' +
                          obj.name +
                          '<span uk-nav-parent-icon></span></a>');

                src_include = false;
            } else {
                html.push('<li class="uk-parent">');
                html.push('<a href="#"><span uk-icon="icon: folder; ratio: 1;"></span>' + obj.name + '<span uk-nav-parent-icon></span></a>');
            }

            for (let list of fs.readdirSync(obj.path)) {
                if (fs.statSync(path.join(obj.path, list)).isDirectory()) {
                    obj.child.push({
                        name: list,
                        path: path.join(obj.path, list),
                        isDirectory: true,
                        child: [],
                    });
                } else if (list.slice(-3) == '.md') {
                    obj.child.push({
                        name: list,
                        path: path.join(obj.path, list),
                        isDirectory: false,
                        child: [],
                    });
                }
            }
            html.push('<ul class="uk-nav-sub" uk-nav="multiple: true">');
            gen_file_tree(obj.child);
        } else {
            html.push('<li>');
            html.push('<a href="/edit' + obj.path.slice(3, obj.path.length) + '">' +
                      '<span uk-icon="icon: file-text; ratio: 1;"></span>' +
                      obj.name + '</a>');
        }
        html.push('</li>');
    }
    html.push('</ul>');
}

module.exports = () => {
    srcdir = [{
        name: 'src',
        path: 'src',
        isDirectory: true,
        child: [],
    }];

    html = ['<ul class="uk-nav-default" uk-nav="multiple: true">'];
    src_include = true;

    let result;
    try {
        gen_file_tree(srcdir);
        result = html;
    } catch(e) {
        console.error(e.message);
        result = [];
    }

    return result.join('\n');
}
