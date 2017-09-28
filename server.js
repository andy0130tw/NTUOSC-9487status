#!/usr/bin/env node
const Promise = require('bluebird');
const express = require('express');
const _routes = require('./routes');
const api = require('./lib/api');

const app = express();

app.set('port', process.env['PORT'] || 80);
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));

function launchServer(resolve, reject) {
    app.listen(app.get('port'), function() {
        resolve(app);
    });
}

Promise.resolve()
.then(() => {
    console.log('9487: Establishing connection to API...');
    return api.connect();
}).then(function (apiConn) {
    console.log('9487: Connected, launching server...');
    app.set('apiConn', apiConn);
    app.use(_routes);
    return new Promise(launchServer);
}).then(() => {
    console.log(`9487: Listening on port ${app.get('port')}...`);
});
