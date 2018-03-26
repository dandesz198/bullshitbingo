import React from 'react';
import { StyleSheet, Text, View, TextInput, StatusBar, TouchableOpacity, Animated, ScrollView, ListView } from 'react-native';
import { StackNavigator } from 'react-navigation';

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = { 
      text: '', 
      x: new Animated.Value(0),
      games: ds.cloneWithRows(['Ki kap legközelebb intőt?', 'Mire fog legközelebb ragelni Dani?']),
     };
  }

  static navigationOptions = {
    title: 'Home'
  };

  componentWillMount() {
    //Starts the first loop in color changing
    this.changeColor();
  }

  render() {
    var bgColor = this.state.x.interpolate({
        inputRange: [1, 2, 3, 4, 5, 6, 7],
        outputRange: ['rgb(26, 188, 156)', 'rgb(22, 160, 133)', 'rgb(46, 204, 113)', 'rgb(39, 174, 96)', 'rgb(52, 152, 219)', 'rgb(41, 128, 185)', 'rgb(155, 89, 182)']
    });

    return (
      <Animated.View style={[styles.container, {backgroundColor: bgColor}]}>
        <StatusBar
          barStyle="light-content"
        />
        <Text style={styles.welcome}>Bullshit Bingo</Text>
        <ScrollView style={{flex: 1}}>
          <Text style={styles.heading}>New game</Text>
          <View style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center'}}>
            <TextInput
              style={[styles.input, {flex: 1}]}
              placeholder="Game PIN"
              placeholderTextColor="#ecf0f1"
              onChangeText={(text) => this.setState({text})}
              value={this.state.text}
            />
            <TouchableOpacity style={[styles.button, {flex: 1}]}>
              <Animated.Text style={[styles.join, {color: bgColor}]}>Join</Animated.Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heading}>Current games</Text>
          <ListView
            dataSource={this.state.games}
            renderRow={(rowData) => 
              <TouchableOpacity onPress={()=>{this.props.navigation.navigate('Home')}}>
                <Text style={styles.gameList}>{rowData}</Text>
              </TouchableOpacity>
            }
          />
        </ScrollView>
      </Animated.View>
    );
  }

  //Animate to the next color
  changeColor() {
      Animated.timing(this.state.x, { toValue: Math.floor(Math.random() * 7), duration: 3500 }).start();
      //Wait 3 sec before animating again
      setTimeout(() => {
        //Continue the animation
        this.changeColor()
      }, 3500);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },

  welcome: {
    fontSize: 40,
    marginTop: 20,
    fontWeight: 'bold',
    color: '#ecf0f1'
  },

  heading: {
    fontSize: 25,
    marginTop: 25,
    fontWeight: 'bold',
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
    marginRight: 20,
    height: 50,
    fontSize: 18,
    borderColor: '#ecf0f1',
    borderBottomWidth: 2.5
  },

  button: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    shadowColor: '#888',
    shadowOffset: {width: 0, height: 2.5},
    shadowOpacity: 0.7
  },

  join: {
    fontSize: 20,
    textAlign: 'center'
  },

  gameList: {
    color: 'white',
    fontWeight: '200',
    fontSize: 20,
    marginVertical: 7.5
  }
});