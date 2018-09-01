/*global Web3*/
cleanContextForImports()
require('web3/dist/web3.min.js')
import axios from 'axios'

//import ZeroClientProvider from './myzero.js'
import ZeroClientProvider from 'web3-provider-engine/zero.js'

const log = require('loglevel')
const LocalMessageDuplexStream = require('post-message-stream')
const setupDappAutoReload = require('./lib/auto-reload.js')
const MetamaskInpageProvider = require('./lib/inpage-provider.js')
restoreContextAfterImports()

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn')

//
// setup plugin communication
//

// setup background connection
var metamaskStream = new LocalMessageDuplexStream({
  name: 'inpage',
  target: 'contentscript',
})

// compose the inpage provider
var inpageProvider = new MetamaskInpageProvider(metamaskStream)

window.addEventListener('SmalletConnet', function (event) {
  //console.log(event);
  console.log("account inpage= v1.0.4");
  window.smalletInfo = event.detail;
  console.log(event.detail);

/*
  var zero = buildZeroClient();
  var web3 = new Web3(zero);

  web3.eth.defaultAccount = window.smalletAccount;
  web3.currentProvider.publicConfigStore = inpageProvider.publicConfigStore;
  web3.smallet = "1";
  window.web3 = web3; 
*/
  var web3mm = new Web3(inpageProvider);
  web3mm.eth.defaultAccount = window.smalletInfo.account;
  web3mm.Smallet = "1"
  window.web3 = web3mm;

}, false);

  const infuraUrl = ["https://mainnet.infura.io/", "https://ropsten.infura.io/", "https://kovan.infura.io/", "https://rinkeby.infura.io/"];
  //const testAccount = "0xF6791CB4A2037Ddb58221b84678a6ba992cda11d";

      function buildZeroClient () {
        var networkId = parseInt(window.smalletNetwork);  
        const zero = new ZeroClientProvider(getOpts(networkId));
        return zero;
      }

      function getOpts(networkId) {
        var opts = {
          rpcUrl: infuraUrl[networkId] + 'du9Plyu1xJErXebTWjsn',
          requestHook: (payload, next, end) => { 
            if (payload.method != 'eth_getBlockByNumber') {
              console.log(payload) 
              metamaskStream.write(payload)
            }
          },
          getAccounts: (cb) => {
              console.log("hooked wallet getAccounts called...");
              let addresses = [window.smalletAccount];
              cb(null, addresses);
          },
          signMessage: (txObj, cb) => {
            console.log("hooked wallet signMessage called...");
            console.log(txObj); // {from: ..., data: ...}
          },
          approvePersonalMessage: (txObj, cb) => {
            console.log("hooked wallet approvePersonalMessage called...");
            cb(null, true);
          },
          signPersonalMessage: (txObj, cb) => {
            console.log("hooked wallet signPersonalMessage called...");
            txObj.action = "signMessage";
            console.log(txObj); // {from: ..., data: ...}
            var objToSend = { deviceToken: window.smalletDeviceToken, txObj: txObj };
            axios.post('https://smallet.co:3001/api/requestsigntx', objToSend)
              .then(function (response) {
                console.log(response.data);
                var signedTx = response.data;
                if (signedTx.result == 'true')
                  cb(null, signedTx.txRaw);
                else {
                  var error = { message: signedTx.txRaw, stack: "Error:" + signedTx.txRaw + ":no stack" };
                  cb(error, null);
                }
              })
              .catch(function (error) {
                console.log(error);
              });
          },
          signTransaction: (txObj, cb) => {
            console.log("hooked wallet signTransaction called...");
            if (txObj.data == "0x")
              txObj.data = "";
            txObj.action = "signTx";
            console.log(txObj);
            var objToSend = { deviceToken: window.smalletDeviceToken, txObj: txObj };
            axios.post('https://smallet.co:3001/api/requestsigntx', objToSend)
              .then(function (response) {
                console.log(response.data);
                var signedTx = response.data;
                if (signedTx.result == 'true')
                  cb(null, signedTx.txRaw);
                else {
                  var error = { message: signedTx.txRaw, stack: "Error:" + signedTx.txRaw + ":no stack" };
                  cb(error, null);
                }
              })
              .catch(function (error) {
                console.log(error);
              });
          }
        };  
        return opts;
      }


//
// setup web3
//

if (typeof window.web3 !== 'undefined') {
  throw new Error(`MetaMask detected another web3.
     MetaMask will not work reliably with another web3 extension.
     This usually happens if you have two MetaMasks installed,
     or MetaMask and another web3 extension. Please remove one
     and try again.`)
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
