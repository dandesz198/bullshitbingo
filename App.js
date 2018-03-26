import React from 'react';
import { StyleSheet, Text, View, TextInput, StatusBar, TouchableOpacity, Animated } from 'react-native';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { text: '', x: new Animated.Value(0) };
  }

  componentWillMount() {
    this.changeColor();
  }

  render() {
    var bgColor = this.state.x.interpolate({
        inputRange: [0, 1, 2, 3, 4, 5],
        outputRange: ['rgb(26, 188, 156)', 'rgb(22, 160, 133)', 'rgb(46, 204, 113)', 'rgb(39, 174, 96)', 'rgb(52, 152, 219)', 'rgb(41, 128, 185)']
    });
    return (
      <Animated.View style={[styles.container, {backgroundColor: bgColor}]}>
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
            <Animated.Text style={[styles.join, {color: bgColor}]}>Join</Animated.Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  changeColor() {
      Animated.timing(this.state.x, { toValue: Math.floor(Math.random() * 5), duration: 3000 }).start();
      setTimeout(() => {
        this.changeColor()
      }, 3000);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
    textAlign: 'center'
  }
});