/*global Web3*/
cleanContextForImports()
require('web3/dist/web3.min.js')

const log = require('loglevel')
const MobileInpageProvider = require('./lib/mobile-inpage-provider.js')
restoreContextAfterImports()

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn')

//
// setup plugin communication
//


// compose the inpage provider
window.smalletInfo = {account: "0xf6791cb4a2037ddb58221b84678a6ba992cda11d", network: "1"}
window.callbackMapper = {};
var inpageProvider = new MobileInpageProvider()

var web3mm = new Web3(inpageProvider);
web3mm.eth.defaultAccount = window.smalletInfo.account;
web3mm.smallet = "1"
window.web3 = web3mm;

window.setSmalletInfo = function(account, network) {
  window.smalletInfo = { account: account, network: network }
  return account;
}

window.resultCallback  = function (newId, result) {
  console.log(result)
  const callbackInfo = window.callbackMapper[newId];
  console.log(callbackInfo)
  result.id = callbackInfo.orgId;
  console.log(result)
  callbackInfo.callback(null, result)
  delete window.callbackMapper[newId];
  return "callback ok"
}

//var web3 = new Web3(inpageProvider)


//web3.setProvider = function () {
//  log.debug('Smallet - overrode web3.setProvider')
//}
log.debug('Smallet - injected web3')

//setupDappAutoReload(web3, inpageProvider.publicConfigStore)

// export global web3, with usage-detection and deprecation warning

/* TODO: Uncomment this area once auto-reload.js has been deprecated:
let hasBeenWarned = false
global.web3 = new Proxy(web3, {
  get: (_web3, key) => {
    // show warning once on web3 access
    if (!hasBeenWarned && key !== 'currentProvider') {
      console.warn('MetaMask: web3 will be deprecated in the near future in favor of the ethereumProvider \nhttps://github.com/MetaMask/faq/blob/master/detecting_metamask.md#web3-deprecation')
      hasBeenWarned = true
    }
    // return value normally
    return _web3[key]
  },
  set: (_web3, key, value) => {
    // set value normally
    _web3[key] = value
  },
})
*/

// set web3 defaultAccount
//inpageProvider.publicConfigStore.subscribe(function (state) {
//  web3.eth.defaultAccount = state.selectedAddress
//})

// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
var __define

/**
 * Caches reference to global define object and deletes it to
 * avoid conflicts with other global define objects, such as
 * AMD's define function
 */
function cleanContextForImports () {
  __define = global.define
  try {
    global.define = undefined
  } catch (_) {
    console.warn('MetaMask - global.define could not be deleted.')
  }
}

/**
 * Restores global define object from cached reference
 */
function restoreContextAfterImports () {
  try {
    global.define = __define
  } catch (_) {
    console.warn('MetaMask - global.define could not be overwritten.')
  }
}
