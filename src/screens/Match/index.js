import React from 'react';
import {
  View,
  TextInput,
  ScrollView,
  ListView,
  Dimensions,
  Alert,
  Vibration,
  Image,
  StatusBar,
} from 'react-native';
import * as firebase from 'firebase';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Card, Text } from '@components';
import { Images } from '@assets';

import styles from './styles';
import I18n from '../../i18n';
import { updateCards } from '../../actions';

const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });

class Match extends React.Component {
  constructor(props) {
    super(props);
    const {
      roomMaster,
      matchName,
      matchMaster,
      matchID,
      roomID,
    } = props.navigation.state.params;
    this.state = {
      roomMaster,
      matchName,
      matchMaster,
      matchID,
      roomID,

      roomCards: [],

      newCardText: '',
    };
  }

  static propTypes = {
    navigation: PropTypes.any.isRequired,
    updateCards: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired,
  };

  componentDidMount() {
    // Sync Database
    this.getData();

    setTimeout(() => {
      this.scrollView.scrollTo({ x: 0, y: 120, animated: false });
    }, 1);
  }

  // Download match data from Database
  getData = () => {
    const { roomID, matchID } = this.state;
    const thus = this;

    // Get data and add listener
    firebase
      .database()
      .ref(`rooms/${roomID}/matches/${matchID}/`)
      .on('value', async snap => {
        // Parse objects
        const snapshot = snap.val();

        const roomCards = [];
        if (snapshot.cards !== null) {
          snapshot.cards.forEach(element => {
            if (!element.voters) {
              element.voters = [];
            }
            roomCards.push(element);
          });
        } else {
          thus.setState({ roomCards: [] });
          return;
        }

        thus.setState({ roomCards });
      });
  };

  // Vote on a card and alert the user if there's more than 2 votes
  vote = cardToVoteOn => {
    const { roomCards } = this.state;
    const { user } = this.props;
    const { myName } = user;

    let votes = 0;
    const card = cardToVoteOn;

    // Check every card for votes
    roomCards.forEach(element => {
      if (element.voters.indexOf(myName) > -1 && !element.isBingo) {
        // Already voted for an active card
        votes += 1;
      }
    });

    if (votes >= 2) {
      Vibration.vibrate();
      Alert.alert(I18n.t('error'), I18n.t('too_many_votes'));
    } else {
      card.voters.push(myName);
    }

    roomCards[roomCards.indexOf(cardToVoteOn)] = card;
    this.setState({ roomCards });

    // Time to sync to Database
    this.syncToDatabase();
  };

  createCard = () => {
    const { newCardText, roomCards } = this.state;
    const { user } = this.props;
    const { myName } = user;
    if (newCardText.length > 0) {
      // Declare variables
      const newCard = {
        text: newCardText,
        creator: myName,
        isBingo: false,
        voters: [],
      };

      // Add new card to the start of the array
      roomCards.unshift(newCard);

      this.setState({ roomCards });
      this.vote(newCard);
      this.setState({ newCardText: '' });

      this.syncToDatabase();
    }
  };

  // Upload data to Database
  syncToDatabase = () => {
    const { roomID, matchID, roomCards } = this.state;
    // Upload every card to Database
    firebase
      .database()
      .ref(`rooms/${roomID}/matches/${matchID}`)
      .update({
        cards: roomCards,
      });
  };

  render() {
    const {
      newCardText,
      matchName,
      roomCards,
      matchMaster,
      roomMaster,
    } = this.state;
    const { user } = this.props;
    const { myName } = user;
    return (
      <ScrollView
        style={styles.container}
        decelerationRate={0}
        ref={ref => {
          this.scrollView = ref;
        }}
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
              fontFamily: 'CabinSketch-Bold',
            }}
            underlineColorAndroid="transparent"
            placeholder={I18n.t('tap_to_create_card')}
            onChangeText={newCardText => this.setState({ newCardText })}
            value={newCardText}
          />
          <Button
            onPress={() => {
              this.createCard();
            }}
            style={{
              marginLeft: 'auto',
              marginRight: 15,
              marginBottom: 10,
            }}
            isDisabled={newCardText.length <= 0}
            isSmall
            text={I18n.t('create')}
          />
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
          <Text isBold style={{ padding: 1.25, fontSize: 16 }}>
            {I18n.t('pull_to_create_card')}
          </Text>
        </View>
        <Text
          isBold
          style={{ fontSize: 30, marginHorizontal: 20, marginVertical: 5 }}
        >
          {matchName}
        </Text>
        <ListView
          dataSource={ds.cloneWithRows(
            roomCards.sort(
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
                const cards = roomCards;
                const card = rowData;

                // Check if user already voted to the card
                if (rowData.voters.indexOf(myName) > -1) {
                  // Delete the vote
                  card.voters.splice(card.voters.indexOf(myName), 1);
                  cards[cards.indexOf(rowData)] = card;
                  this.setState({ roomCards: cards });
                  this.syncToDatabase();
                } else {
                  // Vote, because the user didn't vote on the card
                  this.vote(rowData);
                }
              }}
              onDeletePress={() => {
                Vibration.vibrate();
                Alert.alert(
                  I18n.t('are_you_sure'),
                  `${I18n.t('del_card')} "${rowData.text}"? ${I18n.t(
                    'irreversible'
                  )}`,
                  [
                    {
                      text: I18n.t('delete_it'),
                      onPress: () => {
                        // Declare variables
                        const cards = roomCards;
                        const card = rowData;

                        cards.splice(cards.indexOf(card), 1);

                        this.setState({ roomCards: cards });
                        this.syncToDatabase();
                      },
                      style: 'destructive',
                    },
                    { text: I18n.t('cancel'), style: 'cancel' },
                  ]
                );
              }}
              onBingoPress={() => {
                if (rowData.isBingo) {
                  return;
                }
                Vibration.vibrate();
                Alert.alert(
                  I18n.t('are_you_sure'),
                  `${I18n.t('give_points')} "${rowData.text}". ${I18n.t(
                    'irreversible'
                  )}`,
                  [
                    {
                      text: I18n.t('its_bingo'),
                      onPress: () => {
                        // Declare variables
                        const cards = roomCards;

                        rowData.isBingo = true;

                        this.setState({ roomCards: cards });
                        this.syncToDatabase();

                        if (
                          rowData.voters.length === 1 &&
                          rowData.voters[0] === myName
                        ) {
                          Alert.alert(I18n.t('error'), I18n.t('one_voter'));
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
                    { text: I18n.t('cancel'), style: 'cancel' },
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

const mapStateToProps = ({ rooms, user }) => ({
  rooms,
  user,
});

export default connect(
  mapStateToProps,
  {
    updateCards,
  }
)(Match);
