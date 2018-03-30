import React from 'react';
import { StyleSheet, Text, View, TextInput, StatusBar, TouchableOpacity, Animated, ScrollView, ListView, Dimensions, Platform, Alert } from 'react-native';
import { StackNavigator, NavigationActions } from 'react-navigation';
import * as GestureHandler from 'react-native-gesture-handler';
import { TabViewAnimated, TabBar } from 'react-native-tab-view';
import * as firebase from 'firebase';
import Home from './Home.js';
import Card from './Components/Card.js';

const initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

export default class Game extends React.Component {
  state = {
    index: 0,
    routes: [
      { key: '1', title: 'Bingo' },
      { key: '2', title: 'Match info' }
    ],
    x: new Animated.Value(0),
    value: 0,

    myName: this.props.navigation.state.params.myName,

    gameName: this.props.navigation.state.params.gameName,
    gameId: this.props.navigation.state.params.gameId,
    gameMaster: '',

    gameCards: [],

    gameMembers: [],

    newCardText: ''
  };

  //Compare method for the players array
  compare(a,b) {
    if (a.points < b.points)
      return -1;
    if (a.points > b.points)
      return 1;
    return 0;
  }

  async componentWillMount() {
    //Sync Firebase
    await this.getData();
    //Starts the first loop in color changing
    this.changeColor();
  }

  getData() {
    var thus = this;
    var members = [];

    //Get data
    firebase.database().ref('games/' + this.state.gameId+'/').once('value', function(snap) {
      //Parse objects
      var snapshot = snap.val();

      var gameCards = [];
      if(snapshot.cards) {
        snapshot.cards.forEach(element => {
          if(!element.voters) {
            element.voters = [];
          }
          gameCards.push(element);
        });
      }

      thus.setState({gameMembers: Object.values(snapshot.members), gameMaster: snapshot.master, gameCards: gameCards});
    });
  }

  vote(cardToVoteOn) {
    var cards = this.state.gameCards;
    var votes = 0;
    var card = cardToVoteOn;

    //Check every card for votes
    cards.forEach(element => {
      if(element.voters.indexOf(this.state.myName) > -1) {
        //Already voted
        votes += 1;
      }
    });

    if(votes >= 2) {
      Alert.alert('Error', 'You have more than 2 votes placed. Please unvote atleast one card to vote on this one.');
    } else {
      card.voters.push(this.state.myName);
    }

    cards[cards.indexOf(cardToVoteOn)] = card;
    this.setState({gameCards: cards});

    //Time to sync to Firebase
    this.syncToFirebase();
  }

  syncToFirebase() {
    //Upload every card to Firebase
    firebase.database().ref('games/'+this.state.gameId+'/').update({
      cards: this.state.gameCards
    });
  }

  _handleIndexChange = index => this.setState({ index });

  _renderHeader = (props) => {
    var bgColor = this.state.x.interpolate({
      inputRange: [1, 2, 3, 4, 5],
      outputRange: ['rgb(22, 160, 133)', 'rgb(39, 174, 96)', 'rgb(41, 128, 185)', 'rgb(142, 68, 173)', 'rgb(211, 84, 0)']
    });
    return(<TabBar style={{paddingTop: Platform.OS == 'ios' ? 15 : 0, backgroundColor: bgColor}} {...props}/>);
  };

  _renderScene = ({ route }) => {
    var bgColor = this.state.x.interpolate({
      inputRange: [1, 2, 3, 4, 5],
      outputRange: ['rgb(22, 160, 133)', 'rgb(39, 174, 96)', 'rgb(41, 128, 185)', 'rgb(142, 68, 173)', 'rgb(211, 84, 0)']
    });
    switch (route.key) {
      case '1':
      return (
        <ScrollView 
          style={styles.container} 
          decelerationRate={0}
          contentOffset={{x: 0, y: 125}}
          >
          <View style={{width: Dimensions.get('window').width, backgroundColor: '#d8e1e3', margin: -20, marginBottom: 15, zIndex: 999}}>
            <TextInput
              style={{width: '100%', height: 75, padding: 10, marginBottom: 10, color: '#555', fontSize: 16}}
              underlineColorAndroid='transparent'
              placeholder="Create a new card"
              placeholderTextColor="#666"
              onChangeText={(newCardText) => this.setState({newCardText})}
              value={this.state.newCardText}
            />
            <TouchableOpacity style={{
              justifyContent: 'center',
              width: 100,
              height: 30,
              backgroundColor: '#555',
              borderRadius: 5,
              marginLeft: 'auto',
              marginRight: 15,
              marginBottom: 10
            }} onPress={()=>{
              //Declare variables
              var gameCards = this.state.gameCards;
              var newCard = {text: this.state.newCardText, creator: this.state.myName, voters: []}

              //Add new card to the start of the array
              gameCards.unshift(newCard);

              this.setState({gameCards: gameCards});
              this.vote(newCard);
              this.setState({newCardText: ''});
            }}>
              <Text style={{color: 'white', textAlign: 'center', fontWeight: "bold"}}>Create</Text>
            </TouchableOpacity>
          </View>
          <Text style={{padding: 1.25, textAlign: 'center', fontSize: 14, color: '#888'}}>Grab me to create a new card</Text>
          <ListView
            dataSource={ds.cloneWithRows(this.state.gameCards)}
            enableEmptySections={true}
            style={[styles.membersList, {minHeight: Dimensions.get('window').height}]}
            renderRow={(rowData) => <Card matchName={this.state.gameName} cardText={rowData.text} voteCount={rowData.voters.length} creatorName={rowData.creator} voted={rowData.voters.indexOf(this.state.myName) > -1 ? true : false} bgColor={bgColor} isGameMaster={this.state.gameMaster == this.state.myName ? true : false} onPress={()=>{
              //Declare variables
              var cards = this.state.gameCards;
              var card = rowData;

              //Check if user already voted to the card
              if(rowData.voters.indexOf(this.state.myName) > -1) {
                //Delete the vote
                card.voters.splice(card.voters.indexOf(this.state.myName), 1);
                cards[cards.indexOf(rowData)] = card;
                this.setState({gameCards: cards});
              } else {
                //Vote, because the user didn't vote on the card
                this.vote(rowData);
              }
              
            }}/>}
          />
        </ScrollView>
      );
      case '2':      
      return (
        <ScrollView style={styles.container}>
          <Text style={[styles.heading, {color: '#555', fontSize: 30}]}>{this.state.gameName}</Text>
          <View style={{flexDirection: 'column'}}>
            <Text style={[styles.p, {marginTop: 5}]}>Match PIN:</Text>
            <Text style={styles.h2}>{this.state.gameId}</Text>
            <Text style={[styles.p, {fontSize: 15}]}>Others will use this code to connect to this match.</Text>
          </View>
          <View style={{flexDirection: 'column'}}>
            <Text style={[styles.p, {marginTop: 15}]}>Match master:</Text>
            <Text style={styles.h2}>{this.state.gameMaster}</Text>
            <Text style={[styles.p, {fontSize: 15}]}>They can give points for the winners of the match.</Text>
          </View>
          <Text style={[styles.heading, {color: '#555', fontSize: 30, marginTop: 20}]}>Members</Text>
          <ListView
            dataSource={ds.cloneWithRows(this.state.gameMembers.sort(function(a,b) {return (a.points < b.points) ? 1 : ((b.points < a.points) ? -1 : 0);} ))}
            enableEmptySections={true}
            style={{marginTop: 10, margin: -20}}
            renderRow={(rowData) => 
            <Animated.View style={{flex: 1, paddingHorizontal: 20, height: 40, zIndex: 999, flexDirection: 'row', justifyContent: 'center', backgroundColor: this.state.myName == rowData.name ? bgColor : 'transparent'}}>
              <Text style={[styles.membersListItem, {color: this.state.myName == rowData.name ? 'white' : '#555', marginTop: 7.5}]}><Text style={[styles.membersListItem, {fontWeight: '700', color: this.state.myName == rowData.name ? 'white' : '#555'}]}>{rowData.name}</Text> | {rowData.points} XP</Text>
              <Animated.View style={{display: this.state.myName != this.state.gameMaster && this.state.myName != rowData.name ? 'none' : 'flex', padding: 5, margin: 5, borderColor: this.state.myName == rowData.name ? 'white' : bgColor, borderWidth: 1.5, borderRadius: 5, alignSelf: 'flex-end', marginRight: 0, marginLeft: 'auto'}}>
                <TouchableOpacity onPress={()=>{
                  var thus = this;
                  Alert.alert(
                    'Are you sure?', 
                    this.state.myName == rowData.name ? 'Do you *really* want to quit the match '+this.state.gameName+'? You can still rejoin the match later.' : 'Do you *really* want to kick '+rowData.name+'? They can still rejoin the match.',
                    [ 
                      {text: 'Nope', onPress: () => console.log('Cancel'), style: 'cancel'},
                      {text: 'Yes', onPress: () => {
                        //Determine if the player is the match master
                        if(this.state.myName == this.state.gameMaster) {
                          //If match master AND kicking itself
                          if(this.state.myName == rowData.name) {
                            //But you are the match master - quitting will delete the match
                            Alert.alert(
                              'Are you sure?', 
                              'You are the match master. If you quit, the match will be deleted.',
                              [ 
                                {text: 'Nope', onPress: () => console.log('Cancel'), style: 'cancel'},
                                {text: 'Yes, I want to delete the match', onPress: () => {
                                  //Delete match
                                  firebase.database().ref('games/' + this.state.gameId).remove();
                                  this.deleteGame(this.state.gameName);
                                  thus.props.navigation.dispatch(NavigationActions.back())
                                }, style: 'destructive'}
                              ],
                            );
                          }
                          else {
                            //Since it's not kicking itself, they can kick the player 
                            firebase.database().ref('games/' + this.state.gameId + '/members/'+rowData.name).remove();
                          }
                          
                        }
                        else {
                          if(rowData.name == this.state.myName) {
                            //Quit game
                            firebase.database().ref('games/' + this.state.gameId + '/members/'+rowData.name).remove();
                            this.deleteGame(this.state.gameName);
                            thus.props.navigation.dispatch(NavigationActions.back())
                          } else {
                            //Can't kick others
                            Alert.alert(
                              'Error', 
                              "You aren't the match master. You can't kick other players.",
                              [ 
                                {text: 'Ok', onPress: () => console.log('Cancel'), style: 'cancel'},
                              ],
                            );
                          }
                        }
                        thus.syncDatabase();
                      }, style: 'destructive'}
                    ],
                  );
                }}>
                  <Animated.Text style={{color: this.state.myName == rowData.name ? 'white' : bgColor}}>{this.state.myName == rowData.name ? 'Quit match' : 'Kick player'}</Animated.Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
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
    padding: 20
  },

  welcome: {
    fontSize: 40,
    marginTop: 20,
    fontWeight: 'bold',
    color: '#ecf0f1'
  },

  heading: {
    fontSize: 25,
    fontWeight: 'bold',
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

  membersList: {
    paddingTop: 5
  },

  membersListItem: {
    fontSize: 20,
    color: '#555',
    fontWeight: '500'
  },

  h2: {
    color: '#444',
    fontSize: 34,
    fontWeight: '700'
  },

  p: {
    color: '#666',
    fontSize: 20
  }
});