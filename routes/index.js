const Promise = require('bluebird');
const express = require('express');
const api = require('../lib/api');

const app = express();

let apiConn = null;

function time2int(time_str) {
  if (!time_str) return Math.MAX_SAFE_INTEGER;
  let [_, ww, dd, hh, mm, ss] = time_str.match(/(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
  return (ww || 0) * 604800 + (dd || 0) * 86400 + (hh || 0) * 3600 + (mm || 0) * 60 + ss * 1;
}

app.on('mount', (parent) => {
  apiConn = parent.get('apiConn');
  if (!apiConn) {
    console.error('Attempt to initialize route while API connection is not ready');
  }
});

let lastQuery = null;
let queryCached = null;

app.get('/', (req, resp) => {
  function render(list) {
    resp.render('index', {
      ipList: list,
      clientIP: req.headers['x-forwarded-for']
    });
  }

  const fields = {
      '.id': 'id',
      'last-seen': 'last_seen',
      'host-name': 'hostname',
      'address': 'address'
  };

  if (lastQuery && (new Date() - lastQuery) < 5000) {
    if (!queryCached) {
      resp.send('Too many requests, sorry :(');
      return;
    }

    render(queryCached);
    return;
  }

  lastQuery = new Date() - 0;

  Promise.map([
    api.getIPList,
    api.getRegTable
  ], method => method(apiConn))
  .then(result => {
    let [arrIP, arrReg] = result;
    let regMap = {};
    arrReg.forEach(val => {
      regMap[val['mac-address']] = val;
    });
    arrIP.forEach(item => {
      let regObj;
      if ((regObj = regMap[item['mac-address']])) {
        item._reg = regObj;
      }
    });
    return arrIP;
  }).then(arr => {
    let list = arr.map(obj => {
        let ret = {};
        Object.keys(fields).forEach(key => {
            ret[fields[key]] = obj[key];
        });
        if (obj._reg) {
          ret.wireless = true;
        }
        return ret;
    }).sort((a, b) => time2int(a.last_seen) - time2int(b.last_seen));

    queryCached = list;
    return render(list);
  }).error(err => {
    console.error(err);
    return render(queryCached);
  });
});

module.exports = app;
