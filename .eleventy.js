const hljs = require('highlight.js');
const mdit = require("markdown-it");
const njk = require("nunjucks");
const pug = require("pug");

const { EleventyRenderPlugin } = require("@11ty/eleventy");

module.exports = function(eleventyConfig) {
    // Plugin
    eleventyConfig.addPlugin(EleventyRenderPlugin);

    // Copy `random-folder/img/` to `_site/subfolder/img`
    eleventyConfig.addPassthroughCopy({ "src/assets/img/": "assets/img" });

    // Filter
    eleventyConfig.addNunjucksFilter("split", function(arg1, arg2) {
        return arg1.split(arg2);
    });

    eleventyConfig.addNunjucksFilter("addproperty", function(obj, prop, value) {
        let result = obj;
        result[prop] = value;
        return result;
    });

    // single ShortCode
    eleventyConfig.addShortcode("ruby", function(arg1, arg2) {
        return '<ruby>' +
               arg1 + '<rp>《</rp><rt>' + arg2 + '</rt><rp>》</rp>' +
               '</ruby>';
    });

    eleventyConfig.addShortcode("brx", function(number) {
        let result = '';

        let n = 0;
        while (n < number) {
          result = result + '<br>';
          n++;
        }
        return result;
    });

    eleventyConfig.addShortcode("emphasis", function(str) {
        return '<span style="text-emphasis: sesame #fa3c5a; -webkit-text-emphasis: sesame #fa3c5a;">' +
               str +
               '</span>';
    });

    // paired Shortcode
    eleventyConfig.addPairedShortcode("dialogue", function(content) {
        let result = content.split(/\n/)
        if (result[0] == '') {
            result.shift();
        }
        if (result[-1] == '') {
            result.pop();
        }
        return '<p style="text-indent: -0.5rem; margin-left: 1rem;">' +
               result.join('<br>') +
               '</p>';
    });

    eleventyConfig.addPairedShortcode("wysiwyg", function(content) {
        const splited = content.split(/\n/);

        function searchFunc(_, p1, p2) {
            return p2;
        }

        let regexp = /^( |　)+(.+)$/

        let result = [];
        let n = 0;
        while (n < splited.length) {
            let splited_now = splited[n];
            if (regexp.test(splited_now)) {
                result.push(
                    '<p id="rftgyh" style="text-indent: 1rem;">' +
                    splited_now.replace(regexp, searchFunc) + '<br>' +
                    '</p>'
                );
            } else {
                result.push(
                    '<p style="text-indent: 0rem;">' +
                    splited_now + '<br>' +
                    '</p>'
                );
            }

            n++;
        }

        return result.join('');
    });


    const markdown_it_options = {
        html: true,
        breaks: true,
        linkify: true,
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return '<pre class="hljs language-' + lang + '"><code>' +
                       hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                       '</code></pre>';
                } catch (__) {}
            }

            const highlight_info = hljs.highlightAuto(str);

            //return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
            return '<pre class="hljs language-' + highlight_info.language + '"><code>' +
                   highlight_info.value +
                   '</code></pre>';
        }
    };

    eleventyConfig.setLibrary("md", mdit(markdown_it_options));


    // Creates the extension for use
    eleventyConfig.addTemplateFormats("njk.js");
    eleventyConfig.addExtension("njk.js", {
        outputFileExtension: "js", // optional, default: "html"

        // `compile` is called once per .scss file in the input directory
        compile: async function(inputContent) {
            let result = njk.compile(inputContent);

          // This is the render function, `data` is the full data cascade
            return async (data) => {
                return result.render(data);
            };
        }
    });


    // Creates the extension for use
    eleventyConfig.addTemplateFormats("njk.css");
    eleventyConfig.addExtension("njk.css", {
        outputFileExtension: "css", // optional, default: "html"

        // `compile` is called once per .scss file in the input directory
        compile: async function(inputContent) {
            let result = njk.compile(inputContent);

          // This is the render function, `data` is the full data cascade
            return async (data) => {
                return result.render(data);
            };
        }
    });


    eleventyConfig.ignores.add("short_abstract/");

    return {
        dir: {
            //input: "src",
            //output: "public",
            includes: "_includes", // src/_includes
            layouts: "_layouts", // src/_layouts
            data: "_data",
        },

        pathPrefix: "",

        markdownTemplateEngine: "njk",
        htmlTemplateEngine: "njk"
    }
};
