import React from 'react';
import {
  View,
  TextInput,
  ScrollView,
  ListView,
  Dimensions,
  Alert,
  Image,
  StatusBar,
} from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Card, Text } from '@components';
import { Images } from '@assets';

import styles from './styles';
import I18n from '../../i18n';
import { createCard, deleteCard, vote, unvote, bingo } from '../../actions';
import { newId } from '../../services';

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

      newCardText: '',
    };
  }

  static propTypes = {
    navigation: PropTypes.any.isRequired,
    createCard: PropTypes.func.isRequired,
    deleteCard: PropTypes.func.isRequired,
    bingo: PropTypes.func.isRequired,
    vote: PropTypes.func.isRequired,
    unvote: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired,
    error: PropTypes.object,
    cards: PropTypes.array.isRequired,
  };

  static defaultProps = {
    error: null,
  };

  componentDidMount() {
    setTimeout(() => {
      this.scrollView.scrollTo({ x: 0, y: 120, animated: false });
    }, 1);
  }

  componentDidUpdate(prevProps) {
    const { error } = this.props;
    if (prevProps.error !== error && error) {
      Alert.alert(I18n.t(error.title), I18n.t(error.details));
      // show the alert
    }
  }

  // Vote on a card
  votePrep = card => {
    const { roomID, matchID } = this.state;
    const { user, cards, vote } = this.props;
    const { myName } = user;
    const matchCards = cards.filter(card => card.matchID === matchID);

    let votes = 0;

    // Check every card for votes
    matchCards.forEach(element => {
      if (element.voters.indexOf(myName) > -1 && !element.isBingo) {
        // Already voted for an active card
        votes += 1;
      }
    });

    if (votes >= 2) {
      Alert.alert(I18n.t('error'), I18n.t('too_many_votes'));
    } else {
      vote(roomID, matchID, card.cardID);
    }
  };

  createCard = async () => {
    const { newCardText, roomID, matchID } = this.state;
    const { user, createCard } = this.props;
    const { myName } = user;
    const cardID = `${matchID}_card${newId()}`;
    const card = {
      cardID,
      matchID,
      text: newCardText,
      creator: myName,
      isBingo: false,
      voters: [],
    };
    createCard(roomID, matchID, card);
  };

  render() {
    const {
      newCardText,
      matchName,
      matchMaster,
      roomMaster,
      roomID,
      matchID,
    } = this.state;
    const { user, cards, unvote, deleteCard, bingo } = this.props;
    const { myName } = user;
    const matchCards = cards.filter(card => card.matchID === matchID);
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
            matchCards.sort(
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
              isVoteable
              matchName={matchName}
              cardText={rowData.text}
              voteCount={rowData.voters.length}
              creatorName={rowData.creator}
              voted={rowData.voters.indexOf(myName) > -1}
              isBingo={rowData.isBingo}
              bgColor="white"
              isMaster={!!(matchMaster === myName || roomMaster === myName)}
              onVotePress={() => {
                // Check if user already voted to the card
                if (rowData.voters.indexOf(myName) > -1) {
                  // Delete the vote
                  unvote(roomID, matchID, rowData.cardID);
                } else {
                  // Vote, because the user didn't vote on the card
                  this.votePrep(rowData);
                }
              }}
              onDeletePress={() => {
                Alert.alert(
                  I18n.t('are_you_sure'),
                  `${I18n.t('del_card')} "${rowData.text}"? ${I18n.t(
                    'irreversible'
                  )}`,
                  [
                    {
                      text: I18n.t('delete_it'),
                      onPress: () => {
                        deleteCard(roomID, matchID, rowData);
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
                        bingo(roomID, matchID, rowData);
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

const mapStateToProps = ({ cards, user, error }) => ({
  cards,
  user,
  error,
});

export default connect(
  mapStateToProps,
  {
    createCard,
    deleteCard,
    vote,
    unvote,
    bingo,
  }
)(Match);
