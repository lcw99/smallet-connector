const getUniqueId = require('json-rpc-engine/src/getUniqueId')

module.exports = MobileInpageProvider

function MobileInpageProvider () {
  const self = this
}

// handle sendAsync requests via asyncProvider
// also remap ids inbound and outbound
MobileInpageProvider.prototype.sendAsync = function (payload, cb) {
  const self = this

  switch (payload.method) {

    case 'eth_accounts':
      // read from localStorage
      //lcw
      if (window.smalletInfo) {
        var result = [window.smalletInfo.account];
        //console.log(result)
        if (cb)
          cb(null, {id: payload.id, jsonrpc: payload.jsonrpc, result: result});
        else 
          return new Promise((resolve, reject) => { resolve(result) });
      }
      return;
    case 'net_version':
      if (window.smalletInfo) {
        var network = window.smalletInfo.network;
        const chainIds = ["1", "3", "42", "4"];
        //const chainId = ["main", "ropsten", "kovan", "rinkeby"];
        var result = chainIds[network]
        console.log('net_version=' + result)
        cb(null, {id: payload.id, jsonrpc: payload.jsonrpc, result: result});
      }
      return

    case 'eth_coinbase':
      // process normally
      let result = window.smalletInfo.account || null
      if (cb)
        cb(null, {id: payload.id, jsonrpc: payload.jsonrpc, result: result});
      return
  }

  if (payload.method === 'eth_signTypedData') {
    console.warn('MetaMask: This experimental version of eth_signTypedData will be deprecated in the next release in favor of the standard as defined in EIP-712. See https://git.io/fNzPl for more information on the new standard.')
  }

  console.log(payload)
  const newId = getUniqueId()
  window.callbackMapper[newId] = { orgId: payload.id, callback: cb };
  payload.newId = newId;
  window.JSInterface.sendAsync(JSON.stringify(payload));
}


MobileInpageProvider.prototype.send = function (payload) {
  const self = this

  let result = null
  console.log("MobileInpageProvider=" + payload.method)
  switch (payload.method) {

    case 'eth_accounts':
      // read from localStorage
      //lcw
      if (window.smalletInfo) {
        result = [window.smalletInfo.account]
      }
      break;

    case 'eth_coinbase':
      // read from localStorage
      if (window.smalletInfo) {
        result = window.smalletInfo.account
        break;
      }
      break

    case 'eth_uninstallFilter':
      self.sendAsync(payload, noop)
      result = true
      break

    case 'net_version':
      if (window.smalletInfo) {
        var network = parseInt(window.smalletInfo.network);
        const chainIds = ["1", "3", "42", "4"];
        //const chainId = ["main", "ropsten", "kovan", "rinkeby"];
        result = chainIds[network]
        console.log('net_version=' + result)
      }
      break

    // throw not-supported Error
    default:
      var link = 'https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#dizzy-all-async---think-of-metamask-as-a-light-client'
      var message = `The MetaMask Web3 object does not support synchronous methods like ${payload.method} without a callback parameter. See ${link} for details.`
      throw new Error(message)

  }

  // return the result
  return {
    id: payload.id,
    jsonrpc: payload.jsonrpc,
    result: result,
  }
}

MobileInpageProvider.prototype.isConnected = function () {
  return true
}

MobileInpageProvider.prototype.isMetaMask = true

function noop () {}
