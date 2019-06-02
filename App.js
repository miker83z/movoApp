/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  PermissionsAndroid
} from 'react-native';
import ViewPager from '@react-native-community/viewpager';

import nodeServer from 'nodejs-mobile-react-native';
import DataTransfer from './components/DataTransfer';
import Affectiva from './components/Affectiva';
import Wifi from './components/Wifi';

// Start node server
nodeServer.start('main.js');

type Props = {};
export default class App extends Component<Props> {
  async componentDidMount() {
    await this.requestCameraPermission();
    await this.requestLocationPermission();
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

  async requestLocationPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs access to your Location '
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the location');
      } else {
        console.log('Location permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  }

  render() {
    return (
      <ViewPager style={styles.viewPager} initialPage={0}>
        <View style={styles.container} key="1">
          <DataTransfer />
        </View>
        <View key="2">
          <Affectiva />
        </View>
        <View key="3">
          <Wifi />
        </View>
      </ViewPager>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  },
  viewPager: {
    flex: 1
  }
});
