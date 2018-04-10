import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Animated, ScrollView, ListView, Dimensions, Platform, Alert, Vibration, Image, ImageBackground, StatusBar } from 'react-native';
import { StackNavigator, NavigationActions } from 'react-navigation';
import * as GestureHandler from 'react-native-gesture-handler';
import { TabViewAnimated, TabBar } from 'react-native-tab-view';
import * as firebase from 'firebase';
import Home from './Home.js';
import Card from './Components/Card.js';
import FontText from './Components/FontText.js';
import { Analytics, PageHit, Event } from 'expo-analytics';

let Environment = require('./environment.js')

let initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

let ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

let analytics = new Analytics(Environment.analytics);

transitionConfig : () => ({
	transitionSpec: {
		duration: 0,
		timing: Animated.timing,
		easing: Easing.step0,
	},
})

export default class Room extends React.Component {
  state = {
    index: 0,
    routes: [
      { key: '1', title: 'Matches' },
      { key: '2', title: 'Room info' }
    ],
    x: new Animated.Value(0),
    value: 0,

    myName: this.props.navigation.state.params.myName,

    gameName: this.props.navigation.state.params.gameName,
    gameId: this.props.navigation.state.params.gameId,
    roomMaster: '',

    matches: [],

    gameMembers: [],

    newMatchText: '',
  };

  componentDidMount() {
    //Sync Firebase
    this.getData();

    setTimeout(() => {
      this.scrollView.scrollTo({x: 0, y: 120, animated: false});
    }, 1)

    analytics.hit(new PageHit('Room'));
  }

  createMatch() {
    if (this.state.newMatchText.length > 0) {
      //Declare variables
      var matches = this.state.matches;
      var newMatch = {name: this.state.newMatchText, master: this.state.myName, cards: []}

      //Add new card to the start of the array
      matches.unshift(newMatch);

      this.setState({matches: matches});
      this.setState({newMatchText: ''});

      this.syncToFirebase();

      analytics.event(new Event('NewMatch'));
    } else {
       return;
    }
  }

  quitKick(rowData) {
    var thus = this;
    Vibration.vibrate();
    Alert.alert(
      'Are you sure?', 
      this.state.myName == rowData.name ? 'Do you *really* want to quit the match '+this.state.gameName+'? You can still rejoin the match later.' : 'Do you *really* want to kick '+rowData.name+'? They can still rejoin the match.',
      [ 
        {text: 'Nope', onPress: () => console.log('Cancel'), style: 'cancel'},
        {text: 'Yes', onPress: () => {
          //Determine if the player is the match master
          if(this.state.myName == this.state.roomMaster) {
            //If match master AND kicking itself
            if(this.state.myName == rowData.name) {
              //But you are the match master - quitting will delete the match
              Vibration.vibrate();
              Alert.alert(
                'Are you sure?', 
                'You are the match master. If you quit, the match will be deleted.',
                [ 
                  {text: 'Nope', onPress: () => console.log('Cancel'), style: 'cancel'},
                  {text: 'Yes, I want to delete the match', onPress: () => {
                    //Delete match
                    firebase.database().ref('games/' + this.state.gameId).remove();
                    analytics.event(new Event('Delete game'));
                    this.props.navigation.state.params.returnData(this.state.gameName);
                    this.props.navigation.goBack();
                  }, style: 'destructive'}
                ],
              );
            }
            else {
              //Since it's not kicking itself, they can kick the player
              analytics.event(new Event('Kick'));
              let members = this.state.gameMembers;
              var memb = [];
              members.forEach(element => {
                memb.push(element.name);
              });
              memb.splice(memb.indexOf(rowData.name));
              firebase.database().ref('games/' + this.state.gameId).update({
                'members': memb
              });
            }
            
          }
          else {
            if(rowData.name == this.state.myName) {
              //Quit game
              analytics.event(new Event('Quit'));              
              let members = this.state.gameMembers;
              var memb = [];
              members.forEach(element => {
                memb.push(element.name);
              });
              memb.splice(memb.indexOf(rowData.name));
              firebase.database().ref('games/' + this.state.gameId).update({
                'members': memb
              });
              this.props.navigation.state.params.returnData(this.state.gameName);
              this.props.navigation.goBack();
            } else {
              //Can't kick others
              Vibration.vibrate();
              Alert.alert(
                'Error', 
                "You aren't the match master. You can't kick other players.",
                [ 
                  {text: 'Ok', onPress: () => console.log('Cancel'), style: 'cancel'},
                ],
              );
            }
          }
          thus.syncToFirebase();
        }, style: 'destructive'}
      ],
    );
  }

  //Download match data from Firebase
  async getData() {
    var thus = this;
    var members = [];

    //Get data and add listener
    await firebase.database().ref('games/' + this.state.gameId+'/').on('value', async function(snapshot) {
      //Parse objects
      let snap = snapshot.val();

      let membersName = Object.values(snap.members);
      var members = [];

      thus.setState({roomMaster: snap.master});

      membersName.forEach(element => {
        firebase.database().ref('users/'+element+'/').once('value', function(snp) {
          members.push(snp.val());
        });
      });

      setTimeout(() => {
        thus.setState({gameMembers: members});
      }, 1000);

      var matches = [];

      if(snap.matches) {
        snap.matches.forEach(element => {
          matches.push(element);
        });
        thus.setState({matches: matches});        
      } else {
        thus.setState({matches: []});
      }
    });

    //Add the user kicker listener
    firebase.database().ref('games/'+this.state.gameId+'/members').on('child_removed', async function(snap) {
      if(snap.val() == thus.state.myName) {
        thus.props.navigation.state.params.returnData({id: thus.state.gameId, name: thus.state.matchName});
        thus.props.navigation.goBack();
        Vibration.vibrate();
        Alert.alert('Kicked', "You were kicked from the game. You can still rejoin if you'd like to.");        
      }
    });
  }

  returnData(id) {
    this.props.navigation.state.params.returnData(this.state.gameName);
    this.props.navigation.goBack();
  }

  //Upload data to Firebase
  syncToFirebase() {
    //Upload every card to Firebase
    firebase.database().ref('games/'+this.state.gameId+'/').update({
      matches: this.state.matches
    });
  }

  _handleIndexChange = index => this.setState({ index });

  _renderHeader = (props) => {
    return(<TabBar indicatorStyle={{ backgroundColor: "black" }} labelStyle={{color: 'black', fontSize: 20, fontFamily: 'cabin-sketch'}} style={{paddingTop: 25, backgroundColor: 'white'}} {...props}/>);
  };

  _renderScene = ({ route }) => {
    switch (route.key) {
      case '1':
      return (
        <ScrollView 
          style={styles.container} 
          decelerationRate={0}
          ref={ref => this.scrollView = ref}
          >
          <StatusBar
            barStyle={'dark-content'}/>
          <View style={{width: Dimensions.get('window').width, backgroundColor: '#eee'}}>
            <TextInput
              style={{width: '100%', height: 60, paddingHorizontal: 20, marginBottom: 10, color: '#555', fontSize: 20, fontFamily: 'cabin-sketch-bold'}}
              underlineColorAndroid='transparent'
              placeholder="Tap here to create a new match..."
              placeholderTextColor="#444"
              onChangeText={(newMatchText) => this.setState({newMatchText})}
              value={this.state.newMatchText}
            />
            <TouchableOpacity style={{
              justifyContent: 'center',
              marginLeft: 'auto',
              marginRight: 15,
              marginBottom: 10
            }}
            disabled={this.state.newMatchText.length <= 0 ? true : false}
            onPress={() => this.createMatch()}>
              <ImageBackground source={require('./images/btn.png')} style={{width: 96, height: 40, justifyContent: 'center', opacity: this.state.newMatchText.length <= 0 ? 0.2 : 1}}>
                <FontText isLoaded={true} isBold={true} style={{fontSize: 20, textAlign: 'center'}}>Create</FontText>
              </ImageBackground>
            </TouchableOpacity>
          </View>
          <View style={{marginLeft: 'auto', marginRight: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
            <Image source={require('./images/add_child.png')} style={{width: 75, height: 64, marginRight: 20}}/>
            <FontText isLoaded={true} isBold={true} style={{padding: 1.25, fontSize: 16}}>Pull down to create a new match</FontText>
          </View>
          <ListView
            dataSource={ds.cloneWithRows(this.state.matches)}
            enableEmptySections={true}
            style={[styles.membersList, {minHeight: Dimensions.get('window').height}]}
            renderRow={(rowData) => <Card isMatch={true} matchName={this.state.gameName} cardText={rowData.name} creatorName={rowData.master} bgColor={'white'} isMaster={rowData.master == this.state.myName || this.state.roomMaster == this.state.myName ? true : false} 
            onVotePress={()=>{
                this.props.navigation.navigate('Match', {matchName: rowData.name, gameId: this.state.gameId, myName: this.state.myName, matchId: this.state.matches.indexOf(rowData), matchMaster: rowData.master, roomMaster: this.state.roomMaster, returnData: this.returnData.bind(this)});
            }}
            onBingoPress={()=>{
              Vibration.vibrate();
              Alert.alert('Are you sure?', 'You are now deleting the match "'+rowData.name+'". This action is irreversible. Are you sure?', [
                {
                  text: "I'll delete it",
                  onPress: () => {
                    var matches = this.state.matches;
                    matches.splice(matches.indexOf(rowData), 1);
                    firebase.database().ref('games/' + this.state.gameId).update({
                      'matches': matches
                    });
                  }
                },
                { text: 'Nah', style: 'cancel' }
              ])
            }}
            />
          }
          />
        </ScrollView>
      );
      case '2':      
      return (
        <ScrollView style={{flex: 1, backgroundColor: 'white'}}>
          <StatusBar
            barStyle={'dark-content'}/>
          <View style={{flexDirection: 'row', justifyContent: 'center'}}>
            <View style={{flexDirection: 'column'}}>
              <FontText isLoaded={true} isBold={true} style={styles.p}>room name:</FontText>
              <FontText isLoaded={true} isBold={true} style={styles.h2}>{this.state.gameName}</FontText>
            </View>
            <Image source={require('./images/info_right.png')} style={{marginLeft: 'auto', marginRight: 0, width: 80, height: 100}}/>
          </View>
          <FontText isLoaded={true} isBold={true} style={styles.p}>room master:</FontText>
          <FontText isLoaded={true} isBold={true} style={styles.h2}>{this.state.roomMaster}</FontText>
          <View style={{flexDirection: 'row', justifyContent: 'center', marginLeft: 0, marginRight: 'auto'}}>
            <Image source={require('./images/info_left.png')} style={{marginLeft: 0, width: 80, height: 100}}/>
            <View style={{flexDirection: 'column'}}>
              <FontText isLoaded={true} isBold={true} style={[styles.p]}>room PIN:</FontText>
              <FontText isLoaded={true} isBold={true} style={styles.h2}>{this.state.gameId}</FontText>
            </View>
          </View>
          <FontText isLoaded={true} isBold={true} style={styles.p}>members</FontText>
          <ListView
            dataSource={ds.cloneWithRows(this.state.gameMembers.sort(function(a,b) {return (a.points < b.points) ? 1 : ((b.points < a.points) ? -1 : 0);}))}
            enableEmptySections={true}
            style={{marginTop: 10}}
            renderRow={(rowData) => 
            <View style={{flex: 1, paddingHorizontal: 20, height: 55, flexDirection: 'column', justifyContent: 'center'}}>
              <View style={{flexDirection: 'row', backgroundColor: 'white'}}>
                <Text numberOfLines={1} style={{fontFamily: this.state.myName == rowData.name ? 'cabin-sketch-bold' :  'cabin-sketch', fontSize: 24}}>{rowData.name} | {rowData.points} XP</Text>
                <TouchableOpacity
                  style={{
                    display: this.state.myName != this.state.roomMaster && this.state.myName != rowData.name ? 'none' : 'flex',
                    alignSelf: 'flex-end',
                    marginRight: 0,
                    marginLeft: 'auto',
                    marginTop: 'auto',
                    marginBottom: 'auto',
                    justifyContent: 'center'
                  }}
                  onPress={()=>{this.quitKick(rowData)}}>
                  <ImageBackground source={require('./images/btn.png')} style={{width: 84, height: 35, justifyContent: 'center'}}>
                    <FontText isLoaded={true} isBold={true} style={{fontSize: 18, textAlign: 'center'}}>{this.state.myName == rowData.name ? 'Quit' : 'Kick'}</FontText>
                  </ImageBackground>
                </TouchableOpacity>
              </View>
              <Image style={{marginTop: 2.5, width: 200}} source={require('./images/line_short.png')}/>
            </View>
            }
          />
        </ScrollView>
      );
      default:
      return null;
    }
  };

  render() {
    return (
      <TabViewAnimated
        navigationState={this.state}
        renderScene={this._renderScene}
        renderHeader={this._renderHeader}
        onIndexChange={this._handleIndexChange}
        initialLayout={initialLayout}
      />
    );
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },

  heading: {
    fontSize: 30
  },

  input: {
    color: '#fff',
    padding: 5,
    marginRight: 25,
    height: 45,
    fontSize: 18,
    borderColor: '#fff',
    borderBottomWidth: 2.5
  },

  membersList: {
    paddingTop: 5
  },

  membersListItem: {
    fontSize: 28,
    marginTop: 'auto',
    marginBottom: 'auto'
  },

  h2: {
    fontSize: 40,
    marginLeft: 20
  },

  p: {
    fontSize: 26,
    marginLeft: 20,
    marginTop: 20
  }
});