import React from 'react';
import {
  View,
  Text,
  Button,
  DeviceEventEmitter,
  PermissionsAndroid
} from 'react-native';
import nodeServer from 'nodejs-mobile-react-native';

import AffectivaModule from '../native-modules/AffectivaModule';

export default class Affectiva extends React.Component {
  componentDidMount() {
    this.requestCameraPermission();
  }

  async requestCameraPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'Movo needs access to your camera ',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK'
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the camera');
      } else {
        console.log('Camera permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  }

  startAffectiva() {
    // Start facial recognition
    AffectivaModule.start();
  }

  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Button
          onPress={this.startAffectiva}
          title="Start Facial Recognition"
        />
      </View>
    );
  }
}
