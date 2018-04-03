import React from 'react';
import { StyleSheet, Text, View, TextInput, StatusBar, TouchableOpacity, Animated, ScrollView, ListView, Dimensions, Platform, Alert, Vibration } from 'react-native';
import { StackNavigator, NavigationActions } from 'react-navigation';
import * as GestureHandler from 'react-native-gesture-handler';
import { TabViewAnimated, TabBar } from 'react-native-tab-view';
import * as firebase from 'firebase';
import Home from './Home.js';
import Card from './Components/Card.js';
import { Analytics, PageHit, Event } from 'expo-analytics';

let Environment = require('./environment.js')

let initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

let ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

let analytics = new Analytics(Environment.analytics);

var isMounted = false;

transitionConfig : () => ({
	transitionSpec: {
		duration: 0,
		timing: Animated.timing,
		easing: Easing.step0,
	},
})

export default class Match extends React.Component {
  state = {
    index: 0,
    x: new Animated.Value(0),
    value: 0,

    myName: this.props.navigation.state.params.myName,

    matchName: this.props.navigation.state.params.matchName,
    matchMaster: this.props.navigation.state.params.matchMaster,
    matchId: this.props.navigation.state.params.matchId,
    gameId: this.props.navigation.state.params.gameId,

    gameCards: [],

    gameMembers: [],

    newCardText: '',
  };

  componentDidMount() {
    //Sync Firebase
    this.getData();
    //Starts the first loop in color changing
    this.changeColor();

    //this.refs._scrollView.scrollTo({x: 0, y: 145, animated: false})

    analytics.hit(new PageHit('Match'));
  }

  componentWillMount() {
    isMounted = true;
  }

  componentWillUnmount() {
    isMounted = false;
  }

  //Download match data from Firebase
  getData() {
    var thus = this;
    var members = [];

    //Get data and add listener
    firebase.database().ref('games/'+this.state.gameId+'/matches/'+this.state.matchId+'/').on('value', async function(snap) {
      //Parse objects
      var snapshot = snap.val();

      var gameCards = [];
      if(snapshot.cards != null) {
        snapshot.cards.forEach(element => {
          if(!element.voters) {
            element.voters = [];
          }
          gameCards.push(element);
        });
      } else {
        thus.setState({gameCards: []});
        return;
      }

      thus.setState({gameCards: gameCards});
    });

    //Add the user kicker listener
    firebase.database().ref('games/'+this.state.gameId+'/members').on('child_removed', async function(snap) {
      if(snap.val() == thus.state.myName) {
        thus.props.navigation.state.params.returnData(thus.state.gameName);
        thus.props.navigation.goBack();
        Vibration.vibrate();
        Alert.alert('Kicked', "You were kicked from the game. You can still rejoin if you'd like to.");        
      } else {
        console.log('Someone else got kicked')
      }
    });
  }

  //Vote on a card and alert the user if there's more than 2 votes
  vote(cardToVoteOn) {
    var cards = this.state.gameCards;
    var votes = 0;
    var card = cardToVoteOn;

    //Check every card for votes
    cards.forEach(element => {
      if(element.voters.indexOf(this.state.myName) > -1 && !element.isBingo) {
        //Already voted for an active card
        votes += 1;
      }
    });

    if(votes >= 2) {
      Vibration.vibrate();
      Alert.alert('Error', 'You have more than 2 votes placed. Please unvote atleast one card to vote on this one.');
      analytics.event(new Event('UnsuccessfulVote'));
    } else {
      card.voters.push(this.state.myName);
      analytics.event(new Event('Vote'));
    }

    cards[cards.indexOf(cardToVoteOn)] = card;
    this.setState({gameCards: cards});

    //Time to sync to Firebase
    this.syncToFirebase();
  }

  //Upload data to Firebase
  syncToFirebase() {
    //Upload every card to Firebase
    firebase.database().ref('games/'+this.state.gameId+'/matches/'+this.state.matchId).update({
      cards: this.state.gameCards
    });
  }

  render() {
    var bgColor = this.state.x.interpolate({
      inputRange: [1, 2, 3, 4],
      outputRange: ['rgb(26, 188, 156)', 'rgb(22, 160, 133)', 'rgb(46, 204, 113)', 'rgb(39, 174, 96)']
    });
    return (
      <ScrollView 
        style={styles.container} 
        decelerationRate={0}
        ref="_scrollView"
        >
        <StatusBar
          backgroundColor="#555"
          barStyle="light-content"
        />
        <View style={{width: Dimensions.get('window').width, backgroundColor: '#d8e1e3', marginBottom: 15, zIndex: 999}}>
          <View style={{width: Dimensions.get('window').width, height: 20, backgroundColor: '#555'}}/>
          <TextInput
            style={{width: Dimensions.get('window').width, height: 75, padding: 15, marginBottom: 10, color: '#555', fontSize: 16}}
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
            marginBottom: 10,
            backgroundColor: this.state.newCardText.length > 0 ? '#555' : '#999',
          }} onPress={()=>{
            if (this.state.newCardText.length > 0) {
              //Declare variables
              var gameCards = this.state.gameCards;
              var newCard = {text: this.state.newCardText, creator: this.state.myName, isBingo: false, voters: []}

              //Add new card to the start of the array
              gameCards.unshift(newCard);

              this.setState({gameCards: gameCards});
              this.vote(newCard);
              this.setState({newCardText: ''});

              analytics.event(new Event('NewCard'));
            } else {
              return;
            }
          }}>
            <Text style={{color: 'white', textAlign: 'center', fontWeight: "bold"}}>Create</Text>
          </TouchableOpacity>
        </View>
        <Text style={{padding: 1.25, textAlign: 'center', fontSize: 14, color: '#888'}}>Pull down to create a new card</Text>
        <Text style={{marginLeft: 15, marginVertical: 10, fontWeight: 'bold', textAlign: 'left', fontSize: 36, color: '#555'}}>{this.state.gameName}</Text>
        <ListView
          dataSource={ds.cloneWithRows(this.state.gameCards.sort(function(a,b) {return (a.voters < b.voters) ? 1 : ((b.voters < a.voters) ? -1 : 0);}))}
          enableEmptySections={true}
          style={[styles.membersList, {minHeight: Dimensions.get('window').height}]}
          renderRow={(rowData) => <Card isMatch={false} matchName={this.state.matchName} cardText={rowData.text} voteCount={rowData.voters.length} creatorName={rowData.creator} voted={rowData.voters.indexOf(this.state.myName) > -1 ? true : false} isBingo={rowData.isBingo} bgColor={bgColor} isGameMaster={this.state.matchMaster == this.state.myName ? true : false} 
          onVotePress={()=>{
            //Declare variables
            var cards = this.state.gameCards;
            var card = rowData;

            //Check if user already voted to the card
            if(rowData.voters.indexOf(this.state.myName) > -1) {
              //Delete the vote
              card.voters.splice(card.voters.indexOf(this.state.myName), 1);
              cards[cards.indexOf(rowData)] = card;
              this.setState({gameCards: cards});
              this.syncToFirebase();
              analytics.event(new Event('Unvote'));
            } else {
              //Vote, because the user didn't vote on the card
              this.vote(rowData);
            }
            
          }}
          onDeletePress={()=>{
            Vibration.vibrate();
            Alert.alert('Are you sure?', 'Are you sure want to delete the card "'+rowData.text+'"? This action is irreversible.', [
              {
                text: 'Yep, delete it',
                onPress: ()=>{ 
                  //Declare variables
                  var cards = this.state.gameCards;
                  var card = rowData;

                  cards.splice(cards.indexOf(card), 1);

                  this.setState({gameCards: cards});
                  this.syncToFirebase();
                },
                style: 'destructive'
              },
              { text: 'Nah', style: 'cancel' }
            ])
          }}
          onBingoPress={()=>{
            if(rowData.isBingo) {
              return;
            }
            Vibration.vibrate();
            Alert.alert('Are you sure?', 'You are now going to give points to the voters of the card "'+rowData.text+'". This action is irreversible. Are you sure?', [
              {
                text: "It's BINGO!, I'm pretty sure",
                onPress: ()=>{ 
                  //Declare variables
                  var cards = this.state.gameCards;
                  var card = rowData;

                  rowData.isBingo = true;

                  rowData.voters.forEach(element => {
                    firebase.database().ref('users/'+element+'/points').once('value').then((snap) => {
                      firebase.database().ref('users/'+element+'/').update({
                        points: snap.val() + 1
                      });
                    })
                  });

                  this.setState({gameCards: cards});
                  this.syncToFirebase();
                }
              },
              { text: 'Nah, false alarm', style: 'cancel' }
            ])
          }}
          />}
        />
      </ScrollView>
    );
  }

  //Animate to the next color
  changeColor() {
    if(!isMounted) {
      return;
    }
    var value = this.state.value;
    if(value > 4) {
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

let styles = StyleSheet.create({
  container: {
    flex: 1
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
  }
});