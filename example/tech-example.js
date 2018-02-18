//var RSSCombiner = require('rss-combiner');
var RSSCombiner = require('../lib');
var fs = require('fs');

var techFeedConfig = {
    size: 20,
    feeds: [
        "https://rachelandrew.co.uk/archives/rss.php"
    ],
    pubDate: new Date(),
    custom_namespaces: {
        'content': 'http://purl.org/rss/1.0/modules/content/',
        'dc': 'http://purl.org/dc/elements/1.1/',
        'a10': 'http://www.w3.org/2005/Atom',
        'feedburner': 'http://rssnamespace.org/feedburner/ext/1.0'
      },
};

RSSCombiner(techFeedConfig)
    .then(function (feed) {
        var xml = feed.xml({ indent: true });
        fs.writeFile('xml/tech-example.xml', xml, function (err) {
            if (err) {
                console.error(err);
            } else {
                console.log('Tech feed written');
            }
        });
    });


