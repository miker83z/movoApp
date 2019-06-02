import React from 'react';
import { View, Text, Button, DeviceEventEmitter } from 'react-native';
import { Header } from 'react-native-elements';
import nodeServer from 'nodejs-mobile-react-native';

import AffectivaModule from '../native-modules/AffectivaModule';

export default class Affectiva extends React.Component {
  startAffectiva() {
    // Start facial recognition
    AffectivaModule.start();
  }

  render() {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center'
        }}
      >
        <Header
          centerComponent={{
            text: 'Affectiva',
            style: { color: '#fff', fontSize: 25 }
          }}
        />
        <Text> </Text>
        <Text> </Text>
        <Text> </Text>
        <Text> </Text>
        <Text> </Text>
        <Text> </Text>
        <Text> </Text>
        <Button
          onPress={this.startAffectiva}
          title="Start Facial Recognition"
        />
      </View>
    );
  }
}
