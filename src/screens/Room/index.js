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
import { TabViewAnimated, TabBar } from 'react-native-tab-view';
import * as firebase from 'firebase';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Card, Text } from '@components';
import { Images } from '@assets';

import styles from './styles';
import I18n from '../../i18n';
import NavigationService from '../../config/navigationService';
import { createMatch, deleteRoom } from '../../actions';
import { newId } from '../../services';

const initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });

class Room extends React.Component {
  constructor(props) {
    super(props);
    const { roomID } = props.navigation.state.params;
    const { name, master, matches, members } = props.rooms.find(
      room => room.roomID === roomID
    );
    this.state = {
      index: 0,
      routes: [
        { key: '1', title: I18n.t('matches') },
        { key: '2', title: I18n.t('room_info') },
      ],
      value: 0,

      roomID,
      roomName: name,
      roomMaster: master,
      matches: matches && matches.length > 0 ? matches : [],
      roomMembers: members,

      newMatchText: '',
    };
  }

  static propTypes = {
    navigation: PropTypes.any.isRequired,
    user: PropTypes.object.isRequired,
    createMatch: PropTypes.func.isRequired,
    deleteRoom: PropTypes.func.isRequired,
    rooms: PropTypes.array.isRequired,
    error: PropTypes.object,
  };

  static defaultProps = {
    error: null,
  };

  componentDidMount() {
    // Database sync
    this.getData();

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

  createMatch = () => {
    const { newMatchText, roomID } = this.state;
    const { user, createMatch } = this.props;
    const { myName } = user;
    const match = {
      name: newMatchText,
      master: myName,
      cards: [],
      matchID: `room${roomID}_match${newId()}`,
    };
    createMatch(roomID, match);
  };

  quitKick = rowData => {
    const { roomName, roomMaster, roomID, roomMembers } = this.state;
    const { user, navigation } = this.props;
    const { myName } = user;
    const thus = this;
    Vibration.vibrate();
    Alert.alert(
      I18n.t('are_you_sure'),
      myName === rowData.name
        ? `${I18n.t('really_quit')} ${roomName}? ${I18n.t('rejoin')}`
        : `${I18n.t('really_kick')} ${rowData.name}? ${I18n.t('rejoin_kick')}`,
      [
        {
          text: I18n.t('cancel'),
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: I18n.t('yes'),
          onPress: async () => {
            // Determine if the player is the match master
            if (myName === roomMaster) {
              // If match master AND kicking itself
              if (myName === rowData.name) {
                // But you are the match master - quitting will delete the match
                Vibration.vibrate();
                Alert.alert(
                  I18n.t('are_you_sure'),
                  I18n.t('matchmaster_quit'),
                  [
                    {
                      text: I18n.t('cancel'),
                      onPress: () => console.log('Cancel'),
                      style: 'cancel',
                    },
                    {
                      text: I18n.t('matchmaster_quit_ok'),
                      onPress: () => {
                        this.deleteRoom(roomID);
                        navigation.goBack();
                      },
                      style: 'destructive',
                    },
                  ]
                );
              } else {
                // Since it's not kicking itself, they can kick the player
                const members = roomMembers;
                const memb = [];
                await members.forEach(element => {
                  memb.push(element.name);
                });
                memb.splice(memb.indexOf(rowData.name), 1);
                firebase
                  .database()
                  .ref(`rooms/${roomID}`)
                  .update({
                    members: memb,
                  });
              }
            } else if (rowData.name === myName) {
              // Quit room
              const members = roomMembers;
              const memb = [];
              await members.forEach(element => {
                memb.push(element.name);
              });
              memb.splice(memb.indexOf(rowData.name));
              firebase
                .database()
                .ref(`rooms/${roomID}`)
                .update({
                  members: memb,
                });

              navigation.goBack();
            } else {
              // Can't kick others
              Vibration.vibrate();
              Alert.alert(I18n.t('error'), I18n.t('kick_error'), [
                {
                  text: I18n.t('ok'),
                  onPress: () => console.log('Cancel'),
                  style: 'cancel',
                },
              ]);
            }
            thus.syncToDatabase();
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Download match data from database
  getData = async () => {
    const { roomID } = this.state;
    const members = [];
    const matches = [];

    // Get data and add listener
    await firebase
      .database()
      .ref(`rooms/${roomID}/`)
      .on('value', async snapshot => {
        // Parse objects
        const snap = snapshot.val();

        const membersName = Object.values(snap.members);

        membersName.forEach(element => {
          firebase
            .database()
            .ref(`users/${element}/`)
            .once('value', snp => {
              members.push(snp.val());
            });
        });

        if (snap.matches) {
          snap.matches.forEach(element => {
            matches.push(element);
          });
        }
      });

    this.setState({ roomMembers: members, matches });
  };

  // Upload data to database
  syncToDatabase = () => {
    const { roomID, matches } = this.state;
    // Upload every card to database
    firebase
      .database()
      .ref(`rooms/${roomID}/`)
      .update({
        matches,
      });
  };

  handleIndexChange = index => this.setState({ index });

  renderHeader = props => (
    <TabBar
      indicatorStyle={{ backgroundColor: 'black' }}
      labelStyle={{
        color: 'black',
        fontSize: 20,
        fontFamily: 'CabinSketch-Regular',
      }}
      style={{ paddingTop: 25, backgroundColor: 'white' }}
      {...props}
    />
  );

  renderScene = ({ route }) => {
    const {
      newMatchText,
      matches,
      roomName,
      roomID,
      roomMaster,
      roomMembers,
    } = this.state;
    const { user } = this.props;
    const { myName } = user;
    switch (route.key) {
      case '1':
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
                placeholder={I18n.t('tap_to_create_match')}
                placeholderTextColor="#444"
                onChangeText={newMatchText => this.setState({ newMatchText })}
                value={newMatchText}
              />
              <Button
                onPress={() => this.createMatch()}
                style={{
                  marginLeft: 'auto',
                  marginRight: 15,
                  marginBottom: 10,
                }}
                isSmall
                isDisabled={newMatchText.length <= 0}
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
                {I18n.t('pull_to_create_match')}
              </Text>
            </View>
            <ListView
              dataSource={ds.cloneWithRows(matches)}
              enableEmptySections
              style={[
                styles.membersList,
                { minHeight: Dimensions.get('window').height },
              ]}
              renderRow={rowData => (
                <Card
                  isMatch
                  matchName={roomName}
                  cardText={rowData.name}
                  creatorName={rowData.master}
                  bgColor="white"
                  isMaster={
                    !!(rowData.master === myName || roomMaster === myName)
                  }
                  onVotePress={() => {
                    NavigationService.navigateTo('Match', {
                      matchName: rowData.name,
                      roomID,
                      matchID: rowData.matchID,
                      matchMaster: rowData.master,
                      roomMaster,
                    });
                  }}
                  onBingoPress={() => {
                    Vibration.vibrate();
                    Alert.alert(
                      I18n.t('are_you_sure'),
                      `${I18n.t('del_match')}: "${rowData.name}". ${I18n.t(
                        'irreversible'
                      )}`,
                      [
                        {
                          text: I18n.t('delete_it'),
                          onPress: () => {
                            matches.splice(matches.indexOf(rowData), 1);
                            firebase
                              .database()
                              .ref(`rooms/${roomID}`)
                              .update({
                                matches,
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
      case '2':
        return (
          <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
            <StatusBar barStyle="dark-content" />
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <View style={{ flexDirection: 'column' }}>
                <Text isBold style={styles.p}>
                  {`${I18n.t('room_name')}: `}
                </Text>
                <Text isBold style={styles.h2}>
                  {roomName}
                </Text>
              </View>
              <Image
                source={Images.info_right}
                style={{
                  marginLeft: 'auto',
                  marginRight: 0,
                  width: 80,
                  height: 100,
                }}
              />
            </View>
            <Text isBold style={styles.p}>
              {`${I18n.t('room_master')}: `}
            </Text>
            <Text isBold style={styles.h2}>
              {roomMaster}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                marginLeft: 0,
                marginRight: 'auto',
              }}
            >
              <Image
                source={Images.info_left}
                style={{ marginLeft: 0, width: 80, height: 100 }}
              />
              <View style={{ flexDirection: 'column' }}>
                <Text isBold style={[styles.p]}>
                  {`${I18n.t('room_pin')}: `}
                </Text>
                <Text isBold style={styles.h2}>
                  {roomID}
                </Text>
              </View>
            </View>
            <Text isBold style={styles.p}>
              {I18n.t('members')}
            </Text>
            <ListView
              dataSource={ds.cloneWithRows(
                roomMembers.sort(
                  (a, b) =>
                    a.points < b.points ? 1 : b.points < a.points ? -1 : 0
                )
              )}
              enableEmptySections
              style={{ marginTop: 10 }}
              renderRow={rowData => (
                <View
                  style={{
                    flex: 1,
                    paddingHorizontal: 20,
                    height: 55,
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{ flexDirection: 'row', backgroundColor: 'white' }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily:
                          myName === rowData.name
                            ? 'CabinSketch-Bold'
                            : 'CabinSketch-Regular',
                        fontSize: 24,
                      }}
                    >
                      {`${rowData.name} | ${rowData.points} XP`}
                    </Text>
                    {myName === roomMaster &&
                      myName === rowData.name && (
                        <Button
                          onPress={() => {
                            this.quitKick(rowData);
                          }}
                          style={{
                            alignSelf: 'flex-end',
                            marginRight: 0,
                            marginLeft: 'auto',
                            marginTop: 'auto',
                            marginBottom: 'auto',
                            justifyContent: 'center',
                          }}
                          isSmall
                          text={
                            myName === rowData.name
                              ? I18n.t('quit')
                              : I18n.t('kick')
                          }
                        />
                      )}
                  </View>
                  <Image
                    style={{ marginTop: 2.5, width: 200 }}
                    source={Images.line_short}
                  />
                </View>
              )}
            />
          </ScrollView>
        );
      default:
        return null;
    }
  };

  render() {
    const { index, routes, value } = this.state;
    return (
      <TabViewAnimated
        navigationState={{ index, routes, value }}
        renderScene={this.renderScene}
        renderHeader={this.renderHeader}
        onIndexChange={this.handleIndexChange}
        initialLayout={initialLayout}
      />
    );
  }
}

const mapStateToProps = ({ rooms, user, error }) => ({
  rooms,
  user,
  error,
});

export default connect(
  mapStateToProps,
  {
    createMatch,
    deleteRoom,
  }
)(Room);
