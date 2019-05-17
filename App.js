/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import ViewPager from '@react-native-community/viewpager';

import DataTransfer from './components/DataTransfer';
import Affectiva from './components/Affectiva';

type Props = {};
export default class App extends Component<Props> {
  render() {
    return (
      <ViewPager style={styles.viewPager} initialPage={0}>
        <View style={styles.container} key="1">
          <DataTransfer />
        </View>
        <View key="2">
          <Affectiva />
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
