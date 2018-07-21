import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ListView,
  Dimensions,
  Alert,
  Vibration,
  Image,
  ImageBackground,
  StatusBar,
} from 'react-native';
import * as firebase from 'firebase';
import { Analytics, PageHit, Event } from 'expo-analytics';
import { Card, Text } from '@components';
import Images from '@assets';
import styles from './styles';

const Environment = require('../../config/environment');

const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });

const analytics = new Analytics(Environment.analytics);

export default class Match extends React.Component {
  constructor(props) {
    const {
      myName,
      roomMaster,
      matchName,
      matchMaster,
      matchId,
      gameId,
    } = this.props.navigation.state.params;
    super(props);
    this.state = {
      myName,
      roomMaster,
      matchName,
      matchMaster,
      matchId,
      gameId,

      gameCards: [],

      newCardText: '',
    };
  }

  componentDidMount() {
    // Sync Firebase
    this.getData();

    setTimeout(() => {
      this.scrollView.scrollTo({ x: 0, y: 120, animated: false });
    }, 1);

    analytics.hit(new PageHit('Match'));
  }

  // Download match data from Firebase
  getData() {
    const { gameId, matchId, matchName, myName } = this.state;
    const thus = this;

    // Get data and add listener
    firebase
      .database()
      .ref(`games/${gameId}/matches/${matchId}/`)
      .on('value', async snap => {
        // Parse objects
        const snapshot = snap.val();

        const gameCards = [];
        if (snapshot.cards !== null) {
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

        thus.setState({ gameCards });
      });

    // Add the user kicker listener
    firebase
      .database()
      .ref(`games/${gameId}/members`)
      .on('child_removed', async snap => {
        if (snap.val() === myName) {
          thus.props.navigation.state.params.returnData({
            id: gameId,
            name: matchName,
          });
          thus.props.navigation.goBack();
          Vibration.vibrate();
          Alert.alert(
            'Kicked',
            "You were kicked from the game. You can still rejoin if you'd like to."
          );
        }
      });
  }

  // Vote on a card and alert the user if there's more than 2 votes
  vote(cardToVoteOn) {
    const { gameCards, myName } = this.state;
    let votes = 0;
    const card = cardToVoteOn;

    // Check every card for votes
    gameCards.forEach(element => {
      if (element.voters.indexOf(myName) > -1 && !element.isBingo) {
        // Already voted for an active card
        votes += 1;
      }
    });

    if (votes >= 2) {
      Vibration.vibrate();
      Alert.alert(
        'Error',
        'You have more than 2 votes placed. Please unvote atleast one card to vote on this one.'
      );
      analytics.event(new Event('UnsuccessfulVote'));
    } else {
      card.voters.push(myName);
      analytics.event(new Event('Vote'));
    }

    gameCards[gameCards.indexOf(cardToVoteOn)] = card;
    this.setState({ gameCards });

    // Time to sync to Firebase
    this.syncToFirebase();
  }

  createCard() {
    const { newCardText, myName, gameCards } = this.state;
    if (newCardText.length > 0) {
      // Declare variables
      const newCard = {
        text: newCardText,
        creator: myName,
        isBingo: false,
        voters: [],
      };

      // Add new card to the start of the array
      gameCards.unshift(newCard);

      this.setState({ gameCards });
      this.vote(newCard);
      this.setState({ newCardText: '' });

      this.syncToFirebase();

      analytics.event(new Event('NewCard'));
    }
  }

  // Upload data to Firebase
  syncToFirebase() {
    const { gameId, matchId, gameCards } = this.state;
    // Upload every card to Firebase
    firebase
      .database()
      .ref(`games/${gameId}/matches/${matchId}`)
      .update({
        cards: gameCards,
      });
  }

  render() {
    const {
      newCardText,
      matchName,
      gameCards,
      myName,
      matchMaster,
      roomMaster,
    } = this.state;
    return (
      <ScrollView
        style={styles.container}
        decelerationRate={0}
        ref={ref => (this.scrollView = ref)}
      >
        <StatusBar barStyle="dark-content" />
        <View
          style={{
            width: Dimensions.get('window').width,
            backgroundColor: '#eee',
            paddingTop: 25,
          }}
        >
          <TextInput
            style={{
              width: '100%',
              height: 60,
              paddingHorizontal: 20,
              marginBottom: 10,
              color: '#555',
              fontSize: 20,
              fontFamily: 'cabin-sketch-bold',
            }}
            underlineColorAndroid="transparent"
            placeholder="Tap here to create a new card..."
            placeholderTextColor="#444"
            onChangeText={newCardText => this.setState({ newCardText })}
            value={newCardText}
          />
          <TouchableOpacity
            style={{
              justifyContent: 'center',
              marginLeft: 'auto',
              marginRight: 15,
              marginBottom: 10,
            }}
            disabled={newCardText.length <= 0}
            onPress={() => {
              this.createCard();
            }}
          >
            <ImageBackground
              source={Images.btn}
              style={{
                width: 96,
                height: 40,
                justifyContent: 'center',
                opacity: newCardText.length <= 0 ? 0.2 : 1,
              }}
            >
              <Text
                isLoaded
                isBold
                style={{ fontSize: 20, textAlign: 'center' }}
              >
                Create
              </Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>
        <View
          style={{
            marginLeft: 'auto',
            marginRight: 'auto',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={Images.add_child}
            style={{ width: 75, height: 64, marginRight: 20 }}
          />
          <Text isLoaded isBold style={{ padding: 1.25, fontSize: 16 }}>
            Pull down to create a new card
          </Text>
        </View>
        <Text
          isLoaded
          isBold
          style={{ fontSize: 30, marginHorizontal: 20, marginVertical: 5 }}
        >
          {matchName}
        </Text>
        <ListView
          dataSource={ds.cloneWithRows(
            gameCards.sort(
              (a, b) => (a.voters < b.voters ? 1 : b.voters < a.voters ? -1 : 0)
            )
          )}
          enableEmptySections
          style={[
            styles.membersList,
            { minHeight: Dimensions.get('window').height },
          ]}
          renderRow={rowData => (
            <Card
              isMatch={false}
              matchName={matchName}
              cardText={rowData.text}
              voteCount={rowData.voters.length}
              creatorName={rowData.creator}
              voted={rowData.voters.indexOf(myName) > -1}
              isBingo={rowData.isBingo}
              bgColor="white"
              isMaster={!!(matchMaster === myName || roomMaster === myName)}
              onVotePress={() => {
                // Declare variables
                const cards = gameCards;
                const card = rowData;

                // Check if user already voted to the card
                if (rowData.voters.indexOf(myName) > -1) {
                  // Delete the vote
                  card.voters.splice(card.voters.indexOf(myName), 1);
                  cards[cards.indexOf(rowData)] = card;
                  this.setState({ gameCards: cards });
                  this.syncToFirebase();
                  analytics.event(new Event('Unvote'));
                } else {
                  // Vote, because the user didn't vote on the card
                  this.vote(rowData);
                }
              }}
              onDeletePress={() => {
                Vibration.vibrate();
                Alert.alert(
                  'Are you sure?',
                  `Are you sure want to delete the card "${
                    rowData.text
                  }"? This action is irreversible.`,
                  [
                    {
                      text: 'Yep, delete it',
                      onPress: () => {
                        // Declare variables
                        const cards = gameCards;
                        const card = rowData;

                        cards.splice(cards.indexOf(card), 1);

                        this.setState({ gameCards: cards });
                        this.syncToFirebase();
                      },
                      style: 'destructive',
                    },
                    { text: 'Nah', style: 'cancel' },
                  ]
                );
              }}
              onBingoPress={() => {
                if (rowData.isBingo) {
                  return;
                }
                Vibration.vibrate();
                Alert.alert(
                  'Are you sure?',
                  `You are now going to give points to the voters of the card "${
                    rowData.text
                  }". This action is irreversible. Are you sure?`,
                  [
                    {
                      text: "It's BINGO!, I'm pretty sure",
                      onPress: () => {
                        // Declare variables
                        const cards = gameCards;

                        rowData.isBingo = true;

                        this.setState({ gameCards: cards });
                        this.syncToFirebase();

                        if (
                          rowData.voters.length === 1 &&
                          rowData.voters[0] === myName
                        ) {
                          Alert.alert(
                            'Sorry',
                            "Since only you voted, you won't get your points. Say thank you to the cheaters who tried to boost themself by creating empty cards and BINGO-ing them."
                          );
                          return;
                        }

                        if (rowData.voters.length <= 0) {
                          return;
                        }

                        rowData.voters.forEach(element => {
                          firebase
                            .database()
                            .ref(`users/${element}/points`)
                            .once('value')
                            .then(snap => {
                              firebase
                                .database()
                                .ref(`users/${element}/`)
                                .update({
                                  points: snap.val() + 1,
                                });
                            });
                        });
                      },
                    },
                    { text: 'Nah, false alarm', style: 'cancel' },
                  ]
                );
              }}
            />
          )}
        />
      </ScrollView>
    );
  }
}
