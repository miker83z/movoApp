const reactBridge = require('rn-bridge');
const Web3 = require('web3');
const MAMChannel = require('./iota/MAMChannel');

const iotaIRIProvider = 'https://nodes.devnet.iota.org';
let indexMamChannel;
const indexMamChannelSeedKey = 'index999';
let coordinatesMamChannel;
let coordinatesMamChannelSecretKey = 'SEKRETKEY9';
const costPerMessage = 200;

const PaymentChannelContract = require('./build/contracts/PaymentChannel');
const PaymentChannelAddr = '0xd25dc01e2EcF3c0f0d574A56eFF29FC2Df1A03F5';
const web3Provider = 'ws://127.0.0.1:7545';
const accountNr = 1;
let web3;
let ethAccount;
let myAccountOptions;

const clients = {};

const openMAMChannels = () => {
  indexMamChannel = new MAMChannel(
    'public',
    iotaIRIProvider,
    indexMamChannelSeedKey,
    null
  );
  indexMamChannel.openChannel();

  coordinatesMamChannel = new MAMChannel(
    'restricted',
    iotaIRIProvider,
    null,
    coordinatesMamChannelSecretKey
  );
  coordinatesMamChannel.openChannel();

  indexMamChannel.publish({
    type: 'coordinates',
    root: coordinatesMamChannel.getRoot(),
    timestamp: new Date().getTime()
  });
};

const initWeb3AndContracts = async () => {
  web3 = new Web3(web3Provider);
  const accounts = await web3.eth.getAccounts();
  ethAccount = accounts[accountNr];

  myAccountOptions = {
    from: ethAccount,
    gas: 6000000
  };

  const PaymentChannel = new web3.eth.Contract(
    PaymentChannelContract.abi,
    PaymentChannelAddr
  );

  PaymentChannel.events
    .ChannelCreated({
      filter: {
        receiverAddr: ethAccount
      }
    })
    .on('data', event => {
      reactBridge.channel.send({
        type: 'newPayment',
        payload:
          'New payment channel with a balance of ' +
          event.returnValues.deposit +
          ' MOV'
      });
      //initCommunication(event.returnValues);
    })
    .on('error', error => alert(error));
};

const newClient = (publicKey, sharedSeed) => {
  const myChannel = new MAMChannel(
    'private',
    iotaIRIProvider,
    sharedSeed + '9',
    null
  );
  myChannel.openChannel();

  const hisChannel = new MAMChannel(
    'private',
    iotaIRIProvider,
    sharedSeed,
    null
  );
  hisChannel.openChannel();

  listenMAMChannel(publicKey);

  clients[publicKey] = {
    sharedSeed: sharedSeed,
    hisChannel: hisChannel,
    myChannel: myChannel,
    hisBalance: 0,
    myBalance: 0,
    closed: false
  };
};

const listenMAMChannel = async publicKey => {
  const channel = clients[publicKey];
  let tmpRoot = channel.getRoot();
  while (!clients[publicKey].closed) {
    console.log('Searching for ' + tmpRoot);
    const result = await channel.fetchFrom(tmpRoot);
    if (typeof result.messages !== 'undefined' && result.messages.length > 0) {
      result.messages.forEach(message => {
        processMessage(message, publicKey);
      });
      tmpRoot = result.nextRoot;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }
};

const processMessage = (json, publicKey) => {
  console.log('Fetched', json, '\n');
  if (json.type == 'balance') {
    if (checkSignature(json, publicKey)) {
      if (json.balance > clients[publicKey].balance) {
        clients[publicKey].hisBalance = json.balance;
        const tmp = Math.floor(
          (json.balance - clients[publicKey].myBalance) / costPerMessage
        );
        for (let i = 0; i < tmp; i++) sendMessage(publicKey);
      }
    }
  } else if (json.type == 'close') {
    if (checkSignature(json, publicKey)) {
      console.log('Closed channel');
      sendCloseMessage();
      stop = true;
      //close(json.signature);
    }
  }
};

const checkSignature = async (message, publicKey) => {
  reactBridge.channel.send({ type: 'soliditySha3', payload: publicKey });
  const balanceHash = web3.utils.soliditySha3(
    {
      type: 'address',
      value: myAccount
    },
    {
      type: 'uint32',
      value: blockNumber
    },
    {
      type: 'uint192',
      value: message.balance
    },
    {
      type: 'address',
      value: PaymentChannelAddr
    }
  );

  const accountRecovered = await web3.eth.accounts.recover(
    balanceHash,
    message.signature
  );

  return accountRecovered === otherAccount;
};

// Every message received from react-native.
reactBridge.channel.on('message', async msg => {
  try {
    switch (msg.type) {
      case 'openMAM':
        openMAMChannels();
        reactBridge.channel.send({
          type: 'mamRoot',
          payload: coordinatesMamChannel.getRoot()
        });
        break;
      case 'initWeb3':
        await initWeb3AndContracts();
        reactBridge.channel.send({
          type: 'web3',
          payload: ethAccount
        });
        break;
      case 'sendCoor':
        coordinatesMamChannel.publish({
          payload: msg.payload,
          timestamp: new Date().getTime()
        });
        break;
      case 'newClient':
        newClient(msg.account, msg.sharedKey);
        break;
      default:
        reactBridge.channel.send({
          type: 'error',
          payload: 'Unknown request: ' + msg
        });
        break;
    }
  } catch (err) {
    reactBridge.channel.send({
      type: 'error',
      payload: 'Error: ' + JSON.stringify(err) + ' => ' + err.stack
    });
  }
});
