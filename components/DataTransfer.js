import React from 'react';
import { View, Text, TextInput, DeviceEventEmitter } from 'react-native';
import nodejs from 'nodejs-mobile-react-native';
import BluetoothModule from '../bluetooth/BluetoothModule';

export default class DataTransfer extends React.Component {
  state = {
    bluetooth: 'Off',
    coordinates: {
      lat: null,
      lon: null
    },
    mamRoot: null
  };

  componentDidMount() {
    nodejs.start('main.js');
    this.listenerRef = msg => {
      this.setState({ mamRoot: msg });
    };
    nodejs.channel.addListener(
      'message',
      msg => {
        alert('Node: ' + msg);
        this.listenerRef(msg);
      },
      this
    );
    nodejs.channel.send({ type: 'openMAM' });

    BluetoothModule.initHM();

    DeviceEventEmitter.addListener('bluetooth', this.setBluetooth.bind(this));
    DeviceEventEmitter.addListener(
      'coordinates',
      this.handleCoordinates.bind(this)
    );
  }

  componentWillUnmount() {
    if (this.listenerRef) {
      nodejs.channel.removeListener('message', this.listenerRef);
    }
  }

  setBluetooth(e) {
    this.setState({ bluetooth: e.bluetooth });
  }

  handleCoordinates(e) {
    nodejs.channel.send({ type: 'sendCoor', payload: e });
    this.setState({ coordinates: { lat: e.lat, lon: e.lon } });
  }

  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Bluetooth: {this.state.bluetooth}</Text>
        <Text>Lat: {this.state.coordinates.lat}</Text>
        <Text>Lon: {this.state.coordinates.lon}</Text>
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
