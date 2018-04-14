'use strict'

import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ListView, Dimensions, Platform, Alert, Vibration, Image, ImageBackground, StatusBar } from 'react-native';
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

let ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });

let analytics = new Analytics(Environment.analytics);

export default class Match extends React.Component {
  state = {
    index: 0,
    value: 0,

    myName: this.props.navigation.state.params.myName,

    roomMaster: this.props.navigation.state.params.roomMaster,

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

    setTimeout(() => {
      this.scrollView.scrollTo({ x: 0, y: 120, animated: false });
    }, 1)

    analytics.hit(new PageHit('Match'));
  }

  //Download match data from Firebase
  getData() {
    var thus  = this;
    var members = [];

    //Get data and add listener
    firebase.database().ref('games/' + this.state.gameId + '/matches/' + this.state.matchId + '/').on('value', async function (snap) {
      //Parse objects
      var snapshot = snap.val();

      var gameCards = [];
      if (snapshot.cards != null) {
        snapshot.cards.forEach(element => {
          if (!element.voters) {
            element.voters = [];
          }
          gameCards.push(element);
        });
      } else {
        thus.setState({ gameCards: [] });
        return;
      }

      thus.setState({ gameCards: gameCards });
    });

    //Add the user kicker listener
    firebase.database().ref('games/' + this.state.gameId + '/members').on('child_removed', async function (snap) {
      if (snap.val() == thus.state.myName) {
        thus.props.navigation.state.params.returnData({ id: thus.state.gameId, name: thus.state.matchName });
        thus.props.navigation.goBack();
        Vibration.vibrate();
        Alert.alert('Kicked', "You were kicked from the game. You can still rejoin if you'd like to.");
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
      if (element.voters.indexOf(this.state.myName) > -1 && !element.isBingo) {
        //Already voted for an active card
        votes += 1;
      }
    });

    if (votes >= 2) {
      Vibration.vibrate();
      Alert.alert('Error', 'You have more than 2 votes placed. Please unvote atleast one card to vote on this one.');
      analytics.event(new Event('UnsuccessfulVote'));
    } else {
      card.voters.push(this.state.myName);
      analytics.event(new Event('Vote'));
    }

    cards[cards.indexOf(cardToVoteOn)] = card;
    this.setState({ gameCards: cards });

    //Time to sync to Firebase
    this.syncToFirebase();
  }

  createCard() {
    if (this.state.newCardText.length > 0) {
      //Declare variables
      var gameCards = this.state.gameCards;
      var newCard = { text: this.state.newCardText, creator: this.state.myName, isBingo: false, voters: [] }

      //Add new card to the start of the array
      gameCards.unshift(newCard);

      this.setState({ gameCards: gameCards });
      this.vote(newCard);
      this.setState({ newCardText: '' });

      this.syncToFirebase();

      analytics.event(new Event('NewCard'));
    } else {
      return;
    }
  }

  //Upload data to Firebase
  syncToFirebase() {
    //Upload every card to Firebase
    firebase.database().ref('games/' + this.state.gameId + '/matches/' + this.state.matchId).update({
      cards: this.state.gameCards
    });
  }

  render() {
    return (
      <ScrollView 
        style={styles.container} 
        decelerationRate={0}
        ref={ref => this.scrollView = ref}
        >
        <StatusBar
            barStyle={'dark-content'}/>
        <View style={{width: Dimensions.get('window').width, backgroundColor: '#eee', paddingTop: 25}}>
          <TextInput
            style={{width: '100%', height: 60, paddingHorizontal: 20, marginBottom: 10, color: '#555', fontSize: 20, fontFamily: 'cabin-sketch-bold'}}
            underlineColorAndroid='transparent'
            placeholder="Tap here to create a new card..."
            placeholderTextColor="#444"
            onChangeText={(newCardText) => this.setState({newCardText})}
            value={this.state.newCardText}
          />
          <TouchableOpacity style={{
            justifyContent: 'center',
            marginLeft: 'auto',
            marginRight: 15,
            marginBottom: 10
          }}
          disabled={this.state.newCardText.length <= 0 ? true : false}
          onPress={() => {this.createCard()}}>
            <ImageBackground source={require('./images/btn.png')} style={{width: 96, height: 40, justifyContent: 'center', opacity: this.state.newCardText.length <= 0 ? 0.2 : 1}}>
              <FontText isLoaded={true} isBold={true} style={{fontSize: 20, textAlign: 'center'}}>Create</FontText>
            </ImageBackground>
          </TouchableOpacity>
        </View>
        <View style={{marginLeft: 'auto', marginRight: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
          <Image source={require('./images/add_child.png')} style={{width: 75, height: 64, marginRight: 20}}/>
          <FontText isLoaded={true} isBold={true} style={{padding: 1.25, fontSize: 16}}>Pull down to create a new card</FontText>
        </View>
        <FontText isLoaded={true} isBold={true} style={{fontSize: 30, marginHorizontal: 20, marginVertical: 5}}>{this.state.matchName}</FontText>
        <ListView
          dataSource={ds.cloneWithRows(this.state.gameCards.sort(function(a,b) {return (a.voters < b.voters) ? 1 : ((b.voters < a.voters) ? -1 : 0);}))}
          enableEmptySections={true}
          style={[styles.membersList, {minHeight: Dimensions.get('window').height}]}
          renderRow={(rowData) => <Card isMatch={false} matchName={this.state.matchName} cardText={rowData.text} voteCount={rowData.voters.length} creatorName={rowData.creator} voted={rowData.voters.indexOf(this.state.myName) > -1 ? true : false} isBingo={rowData.isBingo} bgColor={'white'} isMaster={this.state.matchMaster == this.state.myName || this.state.roomMaster == this.state.myName ? true : false} 
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

                  this.setState({gameCards: cards});
                  this.syncToFirebase();

                  if(rowData.voters.length == 1 && rowData.voters[0] == this.state.myName) {
                    Alert.alert('Sorry', "Since only you voted, you won't get your points. Say thank you to the cheaters who tried to boost themself by creating empty cards and BINGO-ing them.");
                    return;
                  }

                  if(rowData.voters.length <= 0) { return; }

                  rowData.voters.forEach(element => {
                    firebase.database().ref('users/'+element+'/points').once('value').then((snap) => {
                      firebase.database().ref('users/'+element+'/').update({
                        points: snap.val() + 1
                      });
                    })
                  }); 
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
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
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