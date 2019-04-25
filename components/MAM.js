import React from 'react';
import { View, Text } from 'react-native';

export default class MAM extends React.Component {
  state = {
    mam: 'null'
  };

  componentDidMount() {}

  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>MAM : {this.state.mam}</Text>
      </View>
    );
  }
}
