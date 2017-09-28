const MikroNode = require('mikronode-ng');
const _config = require('../config.json');

function connect() {
  const conn = new MikroNode.getConnection(_config.API_SERVER, _config.USERNAME, _config.PASSWORD);
  return conn.getConnectPromise();
}

function getIPList(conn) {
  return conn.getCommandPromise('/ip/dhcp-server/lease/print');
}

function getRegTable(conn) {
  return conn.getCommandPromise('/interface/wireless/registration-table/print');
}

module.exports = {
    connect: connect,
    getIPList: getIPList,
    getRegTable: getRegTable,
};
