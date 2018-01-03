'use strict';

const chai = require('chai');
const fs = require('fs');
const chaiAsPromised = require('chai-as-promised');

const mockServer = require("mockttp").getLocal();
chai.use(chaiAsPromised);
const assert = chai.assert;

const streamToString = require('stream-to-string');

const RSSCombiner = require('../lib');

describe('RSSCombiner', function() {
  it('should reject invalid config', function() {
    const invalidConfigs = [
      {}, {size:'1'}, {size:null}, {size:'string'},
      {feeds: []}, {feeds:null}, {feeds:['http://someurl.com']}
    ];

    invalidConfigs
      .forEach(config => {
        assert.isRejected(
          RSSCombiner(config),
          'Invalid config should produce a reject error'
        );
      });
  });

  it('should produce a combined feed of correct size', function() {
    const configs = [
      {
        size:5,
        feeds: [
          'http://feeds.bbci.co.uk/news/rss.xml?edition=uk',
          'http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml'
        ]
      }
    ];

    configs
      .forEach(config => {
        return assert.isFulfilled(
          RSSCombiner(config),
          'Valid config should resolve a feed'
        );
      });
  });

  it('should use a callback function if given', function() {
    const config = {
      size:5,
      feeds: [
        'http://feeds.bbci.co.uk/news/rss.xml?edition=uk',
        'http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml'
      ]
    };

    RSSCombiner(config, (err, feed) => {
      assert.isNull(err);
      assert.isNotNull(feed);
    });
  });

  it('shouldn\'t fail if softFail set to true', function() {
    let config = {
      size: 5,
      feeds: [
        'http://feeds.bbci.co.uk/news/rss.xml?edition=uk',
        'http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
        'http://example.com/fake.xml'
      ]
    };

    assert.isRejected(RSSCombiner(config), 'Should fail if no softFail config value');

    config.softFail = true;

    assert.isFulfilled(RSSCombiner(config));
  });

  it('shouldn\'t reject if callback is a funciton', function() {

    let config = {
      size: 5,
      feeds: [
        'http://feeds.bbci.co.uk/news/rss.xml?edition=uk',
        'http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml'
      ],
      successfulFetchCallback: function() {}
    };

    assert.isFulfilled(RSSCombiner(config), 'Should fail if successfulFetchCallback is not a function');
  });

  it('should order items correctly', function() {
    let config = {
      size: 5,
      feeds: [
        'http://localhost:8089/test/atomdates.xml'
      ]
    };

    mockServer.start(8089);

    mockServer.get("/test/atomdates.xml")
      .thenReply(200, fs.readFileSync('./test/data/atomdates.xml'))
      .then(() => {
        return RSSCombiner(config).then(feed=> {
          console.log(feed)
        });
      })
      .then(()=> mockServer.stop());
  });

  it('should reject if callback is not a funciton', function() {
    let config = {
      size: 5,
      feeds: [
        'http://feeds.bbci.co.uk/news/rss.xml?edition=uk',
        'http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml'
      ],
      successfulFetchCallback: 'test'
    };

    assert.isRejected(RSSCombiner(config), 'Should pass if successfulFetchCallback is a function');
  });

  it('shouldn pass a stream into callback on successful fetch', function() {
    const output = {}
    let config = {
      size: 100,
      feeds: [
        "https://bitsofco.de/rss/", "https://rachelandrew.co.uk/archives/rss.php", "http://rachelnabors.com/rss", "https://thewebivore.com/feed/", "https://blogs.msmvps.com/deborahk/feed/", "https://medium.com/feed/@jecelynyeen", "https://remysharp.com/feed.xml", "https://medium.com/feed/@urish", "https://medium.com/feed/@granze", "https://toddmotto.com/feed.xml", "https://medium.com/feed/@wassimchegham", "https://medium.com/feed/@jorgeucano", "https://omranic.com/feed/", "https://belcher.blog/feed/", "https://50linesofco.de/rss.xml", "https://medium.com/feed/@webmaxru", "https://loiane.com/feed.xml", "https://philna.sh/feed.xml", "https://gokulkrishh.github.io/feed.xml", "https://jvandemo.com/rss/", "https://medium.com/feed/@filipbech", "https://feeds.feedburner.com/juristrumpflohner", "https://meiert.com/en/feed/", "https://medium.com/feed/@cironunesdev", "https://medium.com/feed/@thangman22"
      ],
      successfulFetchCallback: function(streamInfo) { /* Some sort of assert will go here. */ output[streamInfo.url] = streamInfo.stream}
    };

    assert.isFulfilled(RSSCombiner(config).then(feed=> {
      console.log('feedxml length', feed.xml().length);
      for(let item in output) {
        console.log(`${item} length: ${output[item].length}`);
      }
    }));
  });
});
