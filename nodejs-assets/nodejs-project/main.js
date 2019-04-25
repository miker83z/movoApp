// Rename this sample file to main.js to use on your project.
// The main.js file will be overwritten in updates/reinstalls.

const rn_bridge = require('rn-bridge');

const MAMChannel = require('./iota/MAMChannel');

let mam;
const iotaProvider = 'https://nodes.devnet.iota.org';

const openMAMChannel = () => {
  mam = new MAMChannel('private', iotaProvider, null, null);
  mam.openChannel();
  console.log('Opened MAM Channel: ' + mam.getRoot());
};

// Echo every message received from react-native.
rn_bridge.channel.on('message', msg => {
  try {
    switch (msg.type) {
      case 'openMAM':
        openMAMChannel();
        rn_bridge.channel.send(mam.getRoot());
        break;
      case 'sendCoor':
        mam.publish({ payload: msg.payload, timestamp: new Date().getTime() });
        break;
      default:
        rn_bridge.channel.send('unknown request:\n' + msg);
        break;
    }
  } catch (err) {
    rn_bridge.channel.send(
      'Error: ' + JSON.stringify(err) + ' => ' + err.stack
    );
  }
});

// Inform react-native node is initialized.
rn_bridge.channel.send('Node was initialized.');
