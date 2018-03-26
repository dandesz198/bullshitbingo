import React from 'react';
import { StyleSheet, Text, View, TextInput, StatusBar, TouchableOpacity, Animated, ScrollView, ListView, Modal } from 'react-native';
import { StackNavigator } from 'react-navigation';

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = { 
        text: '', 
        x: new Animated.Value(0),
        games: ds.cloneWithRows(['Ki kap legközelebb intőt?', 'Kire fog legközelebb ragelni Dani?']),
        value: 0,
        modalVisible: false
    };
  }

  componentWillMount() {
    //Starts the first loop in color changing
    this.changeColor();
  }

  render() {
    var bgColor = this.state.x.interpolate({
      inputRange: [1, 2, 3, 4, 5],
      outputRange: ['rgb(22, 160, 133)', 'rgb(39, 174, 96)', 'rgb(41, 128, 185)', 'rgb(142, 68, 173)', 'rgb(211, 84, 0)']
    });

    return (
      <Animated.View style={[styles.container, {backgroundColor: bgColor}]}>
        <StatusBar
          barStyle="light-content"
        />
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.modalVisible}>
          <View style={{flex: 1}}>
            <Animated.View style={{padding: 20, backgroundColor: bgColor}}>
                <Text style={[styles.heading, {fontSize: 32}]}>Create a new Bullshit Bingo match</Text>
            </Animated.View>
            <View style={{flex: 1, padding: 20}}>
              <View style={{flexDirection: 'column'}}>
                <Text style={styles.p}>Your game pin:</Text>
                <Text style={styles.h2}>863 981</Text>
              </View>
              <View style={{flexDirection: 'row', height: 45, marginTop: 20}}>
                <Animated.View style={[styles.button, {flex: 1, backgroundColor: bgColor, marginRight: 25}]}>
                  <TouchableOpacity style={[styles.button, {flex: 1, backgroundColor: 'transparent'}]} onPress={()=>{this.setState({modalVisible: false})}}>
                    <Text style={[styles.join, {color: 'white'}]}>Create game</Text>
                  </TouchableOpacity>
                </Animated.View>
                <Animated.View style={[styles.button, {flex: 1, backgroundColor: bgColor}]}>
                  <TouchableOpacity style={[styles.button, {flex: 1, backgroundColor: 'transparent'}]} onPress={()=>{this.setState({modalVisible: false})}}>
                    <Text style={[styles.join, {color: 'white'}]}>Close</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </View>
        </Modal>
        <Text style={styles.welcome}>Bullshit Bingo</Text>
        <ScrollView style={{flex: 1}}>
          <TouchableOpacity style={[styles.button, {marginTop: 20, height: 45}]} onPress={()=>{this.setState({modalVisible: true})}}>
            <Animated.Text style={[styles.join, {color: bgColor}]}>Create new game</Animated.Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Join game</Text>
          <View style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center'}}>
            <TextInput
              style={[styles.input, {flex: 1}]}
              placeholder="Game PIN"
              placeholderTextColor="#ecf0f1"
              keyboardType="number-pad"
              underlineColorAndroid='transparent'
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
              <TouchableOpacity style={{borderColor: '#ecf0f1', borderBottomWidth: .5, padding: 2.5}} onPress={()=>{this.props.navigation.navigate('Game')}}>
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
    var value = this.state.value;
    if(value > 5) {
      value = 0;
    } else {
      value += 1;
    }
    this.setState({value: value});
    Animated.timing(this.state.x, { toValue: value, duration: 3000 }).start();
    //Wait 3 sec before animating again
    setTimeout(() => {
      //Continue the animation
      this.changeColor()
    }, 3000);
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
    fontSize: 30,
    marginTop: 35,
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
    marginRight: 25,
    height: 45,
    fontSize: 18,
    borderColor: '#ecf0f1',
    borderBottomWidth: 2.5
  },

  button: {
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    shadowColor: '#999',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.7
  },

  join: {
    fontSize: 20,
    textAlign: 'center'
  },

  gameList: {
    color: 'white',
    fontWeight: '300',
    fontSize: 20,
    marginVertical: 5
  },

  h2: {
    color: '#555',
    fontSize: 34,
    fontWeight: '700'
  },

  p: {
    color: '#555',
    fontSize: 20
  }
});