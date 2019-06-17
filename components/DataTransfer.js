import React from 'react';
import { View, Text, TextInput, DeviceEventEmitter } from 'react-native';
import { Header } from 'react-native-elements';
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
    mamRoot: null,
    faces: []
  };

  componentDidMount() {
    // Start node server listener
    this.serverListener = msg => {
      try {
        switch (msg.type) {
          case 'mamRoot':
            this.setState({ mamRoot: msg.payload });
            break;
          case 'web3':
            this.setState({ web3: msg.payload });
            break;
          case 'error':
            alert('Error :' + msg.payload);
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

    // Start bluetooth broadcasting
    BluetoothModule.initHM();

    // Start events listener
    this.startEventsListener();

    // Affectiva mam messages
    this.facesSender = setInterval(() => {
      if (this.state.mamRoot && this.state.faces.length > 0) {
        const faces = this.state.faces;
        this.setState({ faces: [] });
        nodeServer.channel.send({ type: 'sendFaces', payload: faces });
      }
    }, 10000);
  }

  componentWillUnmount() {
    if (this.serverListener) {
      nodeServer.channel.removeListener('message', this.serverListener);
    }
  }

  startEventsListener() {
    DeviceEventEmitter.addListener('bluetooth', this.setBluetooth.bind(this));
    DeviceEventEmitter.addListener(
      'coordinates',
      this.handleCoordinates.bind(this)
    );
    DeviceEventEmitter.addListener('faces', this.handleFaces.bind(this));
  }

  setBluetooth(e) {
    this.setState({ bluetooth: e.bluetooth });
  }

  handleCoordinates(e) {
    if (this.state.mamRoot) {
      nodeServer.channel.send({ type: 'sendCoor', payload: e });
    }
    this.setState({ coordinates: { lat: e.lat, lon: e.lon } });
  }

  handleFaces(e) {
    const faces = this.state.faces.concat(e);
    this.setState({ faces });
  }

  render() {
    if (
      typeof this.state.faces !== 'undefined' &&
      this.state.faces.length > 0
    ) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center'
          }}
        >
          <Header
            centerComponent={{
              text: 'Movo',
              style: { color: '#fff', fontSize: 25 }
            }}
          />
          <Text> </Text>
          <Text> </Text>
          <Text> </Text>
          <Text> </Text>
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
          <Text>{JSON.stringify(this.state.faces[0].faces)}</Text>
        </View>
      );
    } else {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center'
          }}
        >
          <Header
            centerComponent={{
              text: 'Movo',
              style: { color: '#fff', fontSize: 25 }
            }}
          />
          <Text> </Text>
          <Text> </Text>
          <Text> </Text>
          <Text> </Text>
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
}
