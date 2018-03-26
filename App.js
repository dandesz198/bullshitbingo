import React from 'react';
import { StyleSheet, Text, View, TextInput, StatusBar, TouchableOpacity } from 'react-native';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { text: '' };
  }

  render() {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
        />
        <Text style={styles.welcome}>Bullshit Bingo</Text>
        <Text style={styles.instructions}>Type in the game's name or PIN to join and start playing.</Text>
        <View style={{flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
          <TextInput
            style={styles.input}
            placeholder="Game PIN"
            placeholderTextColor="#ecf0f1"
            onChangeText={(text) => this.setState({text})}
            value={this.state.text}
          />
          <TouchableOpacity style={styles.button}>
            <Text style={styles.join}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1abc9c',
    alignItems: 'center',
    justifyContent: 'center'
  },

  welcome: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ecf0f1'
  },

  instructions: {
    fontSize: 18,
    textAlign: 'center',
    color: '#ecf0f1'
  },

  input: {
    color: '#ecf0f1',
    padding: 5,
    margin: 20,
    width: 200,
    height: 50,
    fontSize: 18,
    borderColor: '#ecf0f1',
    borderBottomWidth: 2.5
  },

  button: {
    width: 200,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
  },

  join: {
    fontSize: 20,
    textAlign: 'center',
    color: '#1abc9c'
  }
});
