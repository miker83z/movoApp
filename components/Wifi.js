import React from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  FlatList,
  DeviceEventEmitter
} from 'react-native';
import { List, ListItem, Header } from 'react-native-elements';
import nodeServer from 'nodejs-mobile-react-native';
import WifiModule from '../native-modules/WiFiP2PModule';

export default class Wifi extends React.Component {
  state = {
    devices: [],
    loading: false,
    connecting: false,
    groupFormed: false,
    started: false,
    server: false,
    message: null
  };

  componentDidMount() {
    // Start listening to payment contract
    nodeServer.channel.send({ type: 'initWeb3' });
    // Start node server listener
    this.serverListener = msg => {
      try {
        switch (msg.type) {
          case 'newPayment':
            alert(msg.payload);
            break;
          case 'channelClosed':
            alert('Transaction executed');
            break;
          case 'wifiMessage':
            WifiModule.sendMessage(JSON.stringify(msg.payload));
            break;
        }
      } catch (error) {}
    };
    nodeServer.channel.addListener(
      'message',
      msg => this.serverListener(msg),
      this
    );
  }

  componentWillUnmount() {
    if (this.serverListener) {
      nodeServer.channel.removeListener('message', this.serverListener);
    }
  }

  startAsAServer() {
    this.setState({ server: true });
    this.startWifip2pConnection();
  }

  async startWifip2pConnection() {
    this.setState({ loading: true });
    try {
      WifiModule.init();
      if (await WifiModule.isSuccessfulInitialize()) {
        console.log('Starting wifi p2p');

        DeviceEventEmitter.addListener(
          'WIFI_P2P:PEERS_UPDATED',
          this.handleNewPeers.bind(this)
        );
        DeviceEventEmitter.addListener(
          'WIFI_P2P:CONNECTION_INFO_UPDATED',
          this.handleConnection.bind(this)
        );
        DeviceEventEmitter.addListener(
          'WIFI_P2P:START_SERVICE',
          this.handleServiceStarted.bind(this)
        );
        DeviceEventEmitter.addListener(
          'WIFI_P2P:START_RECEIVING',
          this.handleReceivingStarted.bind(this)
        );
        DeviceEventEmitter.addListener(
          'WIFI_P2P:NEW_MESSAGE',
          this.handleNewMessage.bind(this)
        );

        await this.startDiscoveringPeers();
        console.log('Start discovering Peers');
      }
    } catch (error) {
      console.log('Init error' + error);
    }
  }

  handleNewPeers(peers) {
    console.log(peers);
    this.setState({ devices: peers.devices });
  }

  async handleConnection(info) {
    this.setState({
      groupFormed: info.groupFormed
    });
    console.log(info);
    if (this.state.groupFormed) {
      this.stopDiscoveringPeers();

      if (!this.state.started) {
        WifiModule.startCommunication();
      }
    } else {
      this.setState({ loading: true });
      try {
        await this.startDiscoveringPeers();
        console.log('Start discovering Peers');
      } catch (error) {
        console.log('Init error' + error);
      }
    }
  }

  handleServiceStarted() {
    WifiModule.receiveMessage();
    alert('connected');
  }

  handleReceivingStarted() {
    this.setState({ loading: false });
    this.mainProcedure();
  }

  handleNewMessage(message) {
    this.receiveProcedure(message);
  }

  onPeerPress = item => async () => {
    this.setState({ connecting: true, started: true });
    try {
      await this.connect(item.deviceAddress);
      this.stopDiscoveringPeers();
      this.setState({ connecting: false });
    } catch (error) {
      alert(error);
    }
  };

  startDiscoveringPeers() {
    return new Promise((resolve, reject) => {
      WifiModule.discoverPeers(reasonCode => {
        reasonCode === undefined ? resolve() : reject(reasonCode);
      });
    });
  }

  stopDiscoveringPeers() {
    return new Promise((resolve, reject) => {
      WifiModule.stopPeerDiscovery(reasonCode => {
        reasonCode === undefined ? resolve() : reject(reasonCode);
      });
    });
  }

  connect(deviceAddress) {
    return new Promise((resolve, reject) => {
      WifiModule.connect(deviceAddress, status => {
        status === undefined ? resolve() : reject(status);
      });
    });
  }

  getConnectionInfo() {
    return WifiModule.getConnectionInfo();
  }

  mainProcedure() {
    if (this.state.server) {
      nodeServer.channel.send({ type: 'server' });
    }
    nodeServer.channel.send({ type: 'keysHandshake' });
  }

  receiveProcedure(message) {
    console.log(message);
    this.setState({ message: message.payload });
    nodeServer.channel.send({
      type: 'wifiMessage',
      payload: JSON.parse(message.payload)
    });
  }

  renderRow({ item }) {
    return (
      <ListItem
        button
        title={item.deviceName}
        subtitle={item.deviceAddress}
        onPress={this.onPeerPress(item)}
        containerStyle={{ borderBottomWidth: 0 }}
      />
    );
  }

  renderSeparator() {
    return (
      <View
        style={{
          height: 1,
          width: '86%',
          backgroundColor: '#CED0CE'
        }}
      />
    );
  }

  render() {
    if (this.state.groupFormed && !this.state.loading) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center'
          }}
        >
          <Header
            centerComponent={{
              text: 'Wi-Fi p2p',
              style: { color: '#fff', fontSize: 25 }
            }}
          />
          <Text> </Text>
          <Text> </Text>
          <Text> </Text>
          <Text> </Text>
          <Text>Transacting with a peer</Text>
          <Text>{this.state.message}</Text>
        </View>
      );
    } else if (this.state.connecting) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center'
          }}
        >
          <Header
            centerComponent={{
              text: 'Wi-Fi p2p',
              style: { color: '#fff', fontSize: 25 }
            }}
          />
          <Text> </Text>
          <Text> </Text>
          <Text> </Text>
          <Text> </Text>
          <Text>Connecting...</Text>
        </View>
      );
    } else if (this.state.devices.length > 0 && !this.state.groupFormed) {
      return (
        <View>
          <Header
            centerComponent={{
              text: 'Wi-Fi p2p',
              style: { color: '#fff', fontSize: 25 }
            }}
          />
          <FlatList
            data={this.state.devices}
            renderItem={this.renderRow.bind(this)}
            keyExtractor={item => item.deviceAddress}
            ItemSeparatorComponent={this.renderSeparator}
          />
        </View>
      );
    } else if (this.state.loading) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center'
          }}
        >
          <Header
            centerComponent={{
              text: 'Wi-Fi p2p',
              style: { color: '#fff', fontSize: 25 }
            }}
          />
          <Text> </Text>
          <Text> </Text>
          <Text> </Text>
          <Text> </Text>
          <Text>Loading...</Text>
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
              text: 'Wi-Fi p2p',
              style: { color: '#fff', fontSize: 25 }
            }}
          />
          <Text> </Text>
          <Text> </Text>
          <Text> </Text>
          <Text> </Text>
          <Button
            onPress={this.startWifip2pConnection.bind(this)}
            title="Start WiFi P2P"
          />
          <Text> </Text>
          <Text> </Text>
          <Text> </Text>
          <Text> </Text>
          <Button onPress={this.startAsAServer.bind(this)} title="Server" />
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 22
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44
  }
});
