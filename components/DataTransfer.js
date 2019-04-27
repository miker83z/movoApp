import React from 'react';
import { View, Text, TextInput, DeviceEventEmitter } from 'react-native';
import nodeServer from 'nodejs-mobile-react-native';

import BluetoothModule from '../native-modules/BluetoothModule';

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
    // Start node server
    nodeServer.start('main.js');
    // Start listener
    this.serverListener = msg => {
      try {
        switch (msg.type) {
          case 'mamRoot':
            this.setState({ mamRoot: msg.payload });
            break;
          case 'web3':
            this.setState({ web3: msg.payload });
            break;
          case 'newPayment':
            alert(msg.payload);
            break;
          case 'error':
            alert('Error :' + msg.payload);
            break;
          default:
            alert('Unknown request: ' + msg.payload);
            break;
        }
      } catch (error) {
        alert('Error: ' + error);
      }
    };
    nodeServer.channel.addListener(
      'message',
      msg => this.serverListener(msg),
      this
    );
    // Start mam operations
    nodeServer.channel.send({ type: 'openMAM' });
    // Start listening to payment contract
    nodeServer.channel.send({ type: 'initWeb3' });
    // Start bluetooth broadcasting
    BluetoothModule.initHM();
    // Start bluetooth listener
    DeviceEventEmitter.addListener('bluetooth', this.setBluetooth.bind(this));
    DeviceEventEmitter.addListener(
      'coordinates',
      this.handleCoordinates.bind(this)
    );
  }

  componentWillUnmount() {
    if (this.serverListener) {
      nodeServer.channel.removeListener('message', this.serverListener);
    }
  }

  setBluetooth(e) {
    this.setState({ bluetooth: e.bluetooth });
  }

  handleCoordinates(e) {
    nodeServer.channel.send({ type: 'sendCoor', payload: e });
    this.setState({ coordinates: { lat: e.lat, lon: e.lon } });
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
