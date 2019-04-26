import React from 'react';
import { View, Text, TextInput, DeviceEventEmitter } from 'react-native';

import MAMChannel from '../libs/MAMChannel';
import BluetoothModule from '../libs/native-modules/BluetoothModule';

const Web3 = require('web3');
const PaymentChannelContract = require('../build/contracts/PaymentChannel');
const PaymentChannelAddr = '0x60EC670E03cCF8408225852215eeDA47fdf7D1A7';
const privateKey =
  '0xe04507acb821f2ed8c9d8f54225d3943dead9193cd861435ad6447c41a4ac8f2';
const web3Provider = 'ws://127.0.0.1:7545';

const iotaIRIProvider = 'https://nodes.devnet.iota.org';
let coordinatesMamChannelSecretKey = 'SEKRETKEY9';

export default class DataTransfer extends React.Component {
  state = {
    bluetooth: 'OFF',
    web3: 'OFF',
    coordinates: {
      lat: null,
      lon: null
    },
    mamRoot: null
  };

  componentDidMount() {
    //this.initMAM();

    this.initWeb3AndContracts();

    BluetoothModule.initHM();

    DeviceEventEmitter.addListener('bluetooth', this.setBluetooth.bind(this));
    DeviceEventEmitter.addListener(
      'coordinates',
      this.handleCoordinates.bind(this)
    );
  }

  async initWeb3AndContracts() {
    this.web3 = new Web3(web3Provider);
    this.ethAccount = this.web3.eth.accounts.privateKeyToAccount(
      privateKey
    ).address;

    this.setState({ web3: this.ethAccount });

    this.myAccountOptions = {
      from: this.ethAccount,
      gas: 6000000
    };

    this.PaymentChannel = new this.web3.eth.Contract(
      PaymentChannelContract.abi,
      PaymentChannelAddr
    );

    this.PaymentChannel.events
      .ChannelCreated({
        filter: {
          receiverAddr: this.ethAccount
        }
      })
      .on('data', event => {
        initCommunication(event.returnValues);
      })
      .on('error', error => alert(error));
  }

  initCommunication(returnValues) {
    otherAccount = returnValues.senderAddr;
    blockNumber = returnValues.blockNumber;

    openMAMChannel();
    listenMAMChannel();
  }

  setBluetooth(e) {
    this.setState({ bluetooth: e.bluetooth });
  }

  handleCoordinates(e) {
    this.setState({ coordinates: { lat: e.lat, lon: e.lon } });
  }

  setWeb3(e) {
    this.setState({ web3: e.web3 });
  }

  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Bluetooth: {this.state.bluetooth}</Text>
        <Text>Lat: {this.state.coordinates.lat}</Text>
        <Text>Lon: {this.state.coordinates.lon}</Text>
        <Text> </Text>
        <Text>Web3: {this.state.web3}</Text>
        <Text> </Text>
        <Text>MAM: </Text>
        <TextInput
          multiline={true}
          editable={true}
          maxLength={100}
          value={this.state.mamRoot}
        />
      </View>
    );
  }
}
