
let cc_types = {
    by: "表示",
    nc: "非営利",
    nd: "改変禁止",
    sa: "継承"
};

function generate(str) {
    let url = [];
    let license = { ja: [] };

    let splited;
    if (str.indexOf('-') < 0) {
        splited = [str];
    } else {
        splited = str.split('-');
    }

    for (let type of splited) {
        if (cc_types.hasOwnProperty(type.toLowerCase())) {
            url.push(type.toLowerCase());
            license.ja.push(cc_types[type.toLowerCase()]);
        }
    }

    return {
        url: {
            ja: 'https://creativecommons.org/licenses/' + url.join('-') + '/4.0/deed.ja'
        },

        text: {
            ja: 'クリエイティブ・コモンズ ' + license.ja.join(' - ') + ' 4.0 国際 ライセンス'
        },

        icon: {
            normal: 'https://i.creativecommons.org/l/' + url.join('-') + '/4.0/88x31.png',
            small: 'https://i.creativecommons.org/l/' + url.join('-') + '/4.0/88x15.png'
        }
    };
}


function icon(str = 'BY-NC-ND', { cls = '', style = '' } = {}) {
    let data = generate(str);

    let result = [
        '<a rel="license" href="' + data.url.ja + '" class="' + cls + '" style="' + style + '">',
            '<img src="' + data.icon.normal + '" alt="クリエイティブ・コモンズ・ライセンス" style="border-width: 0;">',
        '</a>'
    ].join('');

    return result;
}

function text(str = 'BY-NC-ND', { cls = '', style = '' } = {}) {
    let data = generate(str);

    let result = [
        '<a rel="license" href="' + data.url.ja + '" class="' + cls + '" style="' + style + '">',
            data.text.ja,
        '</a>'
    ].join('');

    return result;
}

module.exports = {
    icon: icon,
    text: text
};
