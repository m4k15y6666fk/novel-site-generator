const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs-extra');

class FrontMatter {
    constructor(...str) {
        this.path = path.join(...str);
        this.originalContent = fs.readFileSync(this.path).toString();

        let content = this.originalContent.split('\n');
        this.line = {};
        this.line.start = content.indexOf('---');
        this.line.end = content.slice(this.line.start + 1).indexOf('---');

        this.body = content.slice(this.line.start + 1).slice(this.line.end + 1).join('\n');
        try {
            this.attributes = yaml.load(
                content.slice(this.line.start + 1).slice(0, this.line.end).join('\n')
            );
        } catch(e) {
            console.error(...str, e);
        }

    }

    update(obj) {
        this.attributes = Object.assign(this.attributes, obj);
    }

    toText() {
        return '---\n' +
               yaml.dump(this.attributes, { indent: 4, forceQuotes: true }) + '\n' +
               '---\n' +
               this.body;
    }

    toFileSystem() {
        fs.writeFileSync(this.path, this.toText());
    }

    write(str) {
        fs.outputFileSync(str, this.toText());
    }
}

module.exports = FrontMatter;
