var config = require('./config.js');
var knox = require('knox');

task('static-upload', [], function (src, dst) {
    if (!src || !dst) {
        fail('Usage: jake static-upload <src> <dst>');
    }

    console.log('Uploading ' + src + ' to S3 ' + dst);

    var client = createKnox();
    client.putFile(src, dst, function(err, res) {
        if (err) {
            throw err;
        }

        if (res.statusCode != 200) {
            console.error('PUT Error!');
            console.error('HTTP ' + res.statusCode);
            console.error(res.headers);
            fail();
        }

        console.log('DONE');
        complete();
    });
}, true);

function createKnox() {
    if (!config.AWS_KEY || !config.AWS_SECRET) {
        fail('AWS_KEY and/or AWS_SECRET are not defined in config');
    }

    var client = knox.createClient({
        key: config.AWS_KEY,
        secret: config.AWS_SECRET,
        bucket: config.AWS_BUCKET
    });
    return client;
}
