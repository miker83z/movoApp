const reactBridge = require('rn-bridge');
const Web3 = require('web3');
const MAMChannel = require('./iota/MAMChannel');

let server = false;

const iotaIRIProvider = 'https://nodes.devnet.iota.org';
let indexMamChannel;
const indexMamChannelSeedKey = 'index9999999999';
let coordinatesMamChannel;
let facesMamChannel;
let mamSecretKey = 'SEKRETKEY9';

const costPerMessage = 200;
const PaymentChannelContract = require('./build/contracts/PaymentChannel');
const PaymentChannelAddr = '0xd25dc01e2EcF3c0f0d574A56eFF29FC2Df1A03F5';
let PaymentChannel;
const web3Provider = 'ws://127.0.0.1:7545';
let accountNr = 0;
let web3;
let ethAccount = '0xf28D1cb997B07DD130E009fb2593710F0743A910';
let serverAccount = '0x6d54fE6b7508b0151Beee05a3f0B7593a789d829';
let myAccountOptions = {
  from: ethAccount,
  gas: 6000000
};
const deposit = 5000;

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
    mamSecretKey
  );
  coordinatesMamChannel.openChannel();

  facesMamChannel = new MAMChannel(
    'restricted',
    iotaIRIProvider,
    null,
    mamSecretKey
  );
  facesMamChannel.openChannel();

  indexMamChannel.publish({
    channels: [
      {
        type: 'coordinates',
        root: coordinatesMamChannel.getRoot()
      },
      {
        type: 'faces',
        root: facesMamChannel.getRoot()
      }
    ],
    timestamp: new Date().getTime()
  });
};

const initWeb3 = () => {
  web3 = new Web3(web3Provider);
  //const accounts = await web3.eth.getAccounts();
  //ethAccount = accounts[accountNr];

  PaymentChannel = new web3.eth.Contract(
    PaymentChannelContract.abi,
    PaymentChannelAddr
  );
};

const addPaymentChannelListener = () => {
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

const setServer = () => {
  server = true;
  accountNr = 1;
  ethAccount = serverAccount;
  addPaymentChannelListener();
};

const sendPublicKey = () => {
  reactBridge.channel.send({
    type: 'wifiMessage',
    payload: {
      message: {
        type: 'handshake'
      },
      publicKey: ethAccount
    }
  });
};

const processMessage = async (json, publicKey) => {
  if (!(publicKey in clients)) {
    await newClient(publicKey);
  }
  console.log('Fetched', json);

  if (json.type == 'balance') {
    if (checkSignature(json, publicKey)) {
      if (server) {
        if (json.balance > clients[publicKey].hisBalance) {
          clients[publicKey].hisBalance = clients[publicKey].myBalance =
            json.balance;
          sendMessage(publicKey);
        }
      } else {
        if (json.balance === clients[publicKey].myBalance) {
          console.log('Client accepting message');
          clients[publicKey].hisBalance = json.balance;
          close(publicKey, json.signature);
        }
      }
    }
  }
};

const checkSignature = async (message, publicKey) => {
  const balanceHash = web3.utils.soliditySha3(
    {
      type: 'address',
      value: ethAccount
    },
    {
      type: 'uint32',
      value: message.blockNumber
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

  return accountRecovered === publicKey;
};

const newClient = async publicKey => {
  console.log('New client', publicKey);
  clients[publicKey] = {
    hisBalance: 0,
    myBalance: 0,
    blockNumber: 0,
    closed: false
  };

  if (!server) {
    console.log('Opening Payment Channel');
    await openPaymentChannel(publicKey);
  }
};

const openPaymentChannel = publicKey => {
  //const receipt = await
  PaymentChannel.methods
    .createChannel(publicKey, deposit)
    .send(myAccountOptions)
    .on('transactionHash', async hash => {
      console.log('transaction ', hash);
      const tx = await web3.eth.getTransaction(hash);
      clients[publicKey].blockNumber = tx.blockNumber;
      console.log(
        'Opened Payment Channel with deposit: ' +
          deposit +
          ' and block number: ' +
          tx.blockNumber
      );
      requestService(publicKey);
    })
    .on('error', console.error);
};

const requestService = publicKey => {
  clients[publicKey].myBalance += 200;
  sendMessage(publicKey);
};

const sendMessage = async publicKey => {
  console.log(
    'Sending balance message to ' +
      publicKey +
      ' with balance ' +
      clients[publicKey].myBalance
  );
  const senderSign = await signBalance(publicKey);

  reactBridge.channel.send({
    type: 'wifiMessage',
    payload: {
      message: {
        type: 'balance',
        message: '',
        balance: clients[publicKey].myBalance,
        blockNumber: clients[publicKey].blockNumber,
        signature: senderSign
      },
      publicKey: ethAccount
    }
  });
};

const signBalance = async publicKey => {
  const senderHash = web3.utils.soliditySha3(
    {
      type: 'address',
      value: publicKey
    },
    {
      type: 'uint32',
      value: clients[publicKey].blockNumber
    },
    {
      type: 'uint192',
      value: clients[publicKey].myBalance
    },
    {
      type: 'address',
      value: PaymentChannelAddr
    }
  );
  return await web3.eth.sign(senderHash, ethAccount);
};

const close = async (publicKey, receiverSign) => {
  const senderSign = await signBalance(publicKey);

  console.log('Closing channel...');
  try {
    /*await PaymentChannel.methods
      .closeChannel(
        publicKey,
        clients[publicKey].blockNumber,
        clients[publicKey].myBalance,
        senderSign,
        receiverSign
      )
      .send(myAccountOptions);*/
    console.log('Channel closed');
    reactBridge.channel.send({
      type: 'channelClosed'
    });
  } catch (e) {
    console.log(e);
  }
};

// Every message received from react-native.
reactBridge.channel.on('message', async msg => {
  try {
    switch (msg.type) {
      case 'openMAM':
        openMAMChannels();
        reactBridge.channel.send({
          type: 'mamRoot',
          payload: facesMamChannel.getRoot()
        });
        break;
      case 'initWeb3':
        await initWeb3();
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
      case 'sendFaces':
        facesMamChannel.publish({
          payload: msg.payload,
          timestamp: new Date().getTime()
        });
        break;
      case 'server':
        setServer();
        reactBridge.channel.send({
          type: 'web3',
          payload: ethAccount
        });
        break;
      case 'keysHandshake':
        sendPublicKey();
        break;
      case 'wifiMessage':
        processMessage(msg.payload.message, msg.payload.publicKey);
        break;
      case 'newClient':
        newClient(msg.account);
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
