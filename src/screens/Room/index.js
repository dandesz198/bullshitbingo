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
import { TabViewAnimated, TabBar } from 'react-native-tab-view';
import * as firebase from 'firebase';
import { Analytics, PageHit, Event } from 'expo-analytics';
import { Card, Text } from '@components';
import { Images } from '@assets';
import styles from './styles';
import I18n from '../../i18n';

const Environment = require('../../config/environment');

const initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });

const analytics = new Analytics(Environment.analytics);

export default class Room extends React.Component {
  constructor(props) {
    super(props);
    const { navigation } = this.props;
    this.state = {
      index: 0,
      routes: [
        { key: '1', title: 'Matches' },
        { key: '2', title: 'Room info' },
      ],
      value: 0,

      myName: navigation.state.params.myName,

      gameName: navigation.state.params.gameName,
      gameId: navigation.state.params.gameId,
      roomMaster: '',

      matches: [],

      gameMembers: [],

      newMatchText: '',
    };
  }

  componentDidMount() {
    // Sync Firebase
    this.getData();

    setTimeout(() => {
      this.scrollView.scrollTo({ x: 0, y: 120, animated: false });
    }, 1);

    analytics.hit(new PageHit('Room'));
  }

  createMatch = () => {
    const { newMatchText, matches, myName } = this.state;
    if (newMatchText.length > 0) {
      // Declare variables
      const newMatch = {
        name: newMatchText,
        master: myName,
        cards: [],
      };

      // Add new card to the start of the array
      matches.unshift(newMatch);

      this.setState({ matches });
      this.setState({ newMatchText: '' });

      this.syncToFirebase();

      analytics.event(new Event('NewMatch'));
    }
  };

  quitKick = rowData => {
    const { myName, gameName, roomMaster, gameId, gameMembers } = this.state;
    const { navigation } = this.props;
    const thus = this;
    Vibration.vibrate();
    Alert.alert(
      I18n.t('are_you_sure'),
      myName === rowData.name
        ? `${I18n.t('really_quit')} ${gameName}? ${I18n.t('rejoin')}`
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
                        // Delete match
                        firebase
                          .database()
                          .ref(`games/${gameId}`)
                          .remove();
                        analytics.event(new Event('Delete game'));
                        navigation.state.params.returnData(gameName);
                        navigation.goBack();
                      },
                      style: 'destructive',
                    },
                  ]
                );
              } else {
                // Since it's not kicking itself, they can kick the player
                const members = gameMembers;
                const memb = [];
                await members.forEach(element => {
                  memb.push(element.name);
                });
                memb.splice(memb.indexOf(rowData.name), 1);
                firebase
                  .database()
                  .ref(`games/${gameId}`)
                  .update({
                    members: memb,
                  });
                analytics.event(new Event('Kick'));
              }
            } else if (rowData.name === myName) {
              // Quit game
              const members = gameMembers;
              const memb = [];
              await members.forEach(element => {
                memb.push(element.name);
              });
              memb.splice(memb.indexOf(rowData.name));
              firebase
                .database()
                .ref(`games/${gameId}`)
                .update({
                  members: memb,
                });
              analytics.event(new Event('Quit'));
              navigation.state.params.returnData(gameName);
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
            thus.syncToFirebase();
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Download match data from Firebase
  getData = async () => {
    const { gameId, myName, matchName } = this.state;
    const thus = this;

    // Get data and add listener
    await firebase
      .database()
      .ref(`games/${gameId}/`)
      .on('value', async snapshot => {
        // Parse objects
        const snap = snapshot.val();

        const membersName = Object.values(snap.members);
        const members = [];

        thus.setState({ roomMaster: snap.master });

        membersName.forEach(element => {
          firebase
            .database()
            .ref(`users/${element}/`)
            .once('value', snp => {
              members.push(snp.val());
            });
        });

        setTimeout(() => {
          thus.setState({ gameMembers: members });
        }, 1000);

        const matches = [];

        if (snap.matches) {
          snap.matches.forEach(element => {
            matches.push(element);
          });
          thus.setState({ matches });
        } else {
          thus.setState({ matches: [] });
        }
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
          Alert.alert(I18n.t('kicked'), I18n.t('kicked_desc'));
        }
      });
  };

  returnData = () => {
    const { gameName } = this.state;
    const { navigation } = this.props;
    navigation.state.params.returnData(gameName);
    navigation.goBack();
  };

  // Upload data to Firebase
  syncToFirebase = () => {
    const { gameId, matches } = this.state;
    // Upload every card to Firebase
    firebase
      .database()
      .ref(`games/${gameId}/`)
      .update({
        matches,
      });
  };

  handleIndexChange = index => this.setState({ index });

  renderHeader = props => (
    <TabBar
      indicatorStyle={{ backgroundColor: 'black' }}
      labelStyle={{ color: 'black', fontSize: 20, fontFamily: 'cabin-sketch' }}
      style={{ paddingTop: 25, backgroundColor: 'white' }}
      {...props}
    />
  );

  renderScene = ({ route }) => {
    const {
      newMatchText,
      matches,
      gameName,
      gameId,
      myName,
      roomMaster,
      gameMembers,
    } = this.state;
    const { navigation } = this.props;
    switch (route.key) {
      case '1':
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
                placeholder={I18n.t('tap_to_create_match')}
                placeholderTextColor="#444"
                onChangeText={newMatchText => this.setState({ newMatchText })}
                value={newMatchText}
              />
              <TouchableOpacity
                style={{
                  justifyContent: 'center',
                  marginLeft: 'auto',
                  marginRight: 15,
                  marginBottom: 10,
                }}
                disabled={newMatchText.length <= 0}
                onPress={() => this.createMatch()}
              >
                <ImageBackground
                  source={Images.btn}
                  style={{
                    width: 96,
                    height: 40,
                    justifyContent: 'center',
                    opacity: newMatchText.length <= 0 ? 0.2 : 1,
                  }}
                >
                  <Text
                    isLoaded
                    isBold
                    style={{ fontSize: 20, textAlign: 'center' }}
                  >
                    {I18n.t('create')}
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
                  matchName={gameName}
                  cardText={rowData.name}
                  creatorName={rowData.master}
                  bgColor="white"
                  isMaster={
                    !!(rowData.master === myName || roomMaster === myName)
                  }
                  onVotePress={() => {
                    navigation.navigate('Match', {
                      matchName: rowData.name,
                      gameId,
                      myName,
                      matchId: matches.indexOf(rowData),
                      matchMaster: rowData.master,
                      roomMaster,
                      returnData: this.returnData.bind(this),
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
                              .ref(`games/${gameId}`)
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
                <Text isLoaded isBold style={styles.p}>
                  {`${I18n.t('room_name')}: `}
                </Text>
                <Text isLoaded isBold style={styles.h2}>
                  {gameName}
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
            <Text isLoaded isBold style={styles.p}>
              {`${I18n.t('room_master')}: `}
            </Text>
            <Text isLoaded isBold style={styles.h2}>
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
                <Text isLoaded isBold style={[styles.p]}>
                  {`${I18n.t('room_pin')}: `}
                </Text>
                <Text isLoaded isBold style={styles.h2}>
                  {gameId}
                </Text>
              </View>
            </View>
            <Text isLoaded isBold style={styles.p}>
              {I18n.t('members')}
            </Text>
            <ListView
              dataSource={ds.cloneWithRows(
                gameMembers.sort(
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
                            ? 'cabin-sketch-bold'
                            : 'cabin-sketch',
                        fontSize: 24,
                      }}
                    >
                      {`${rowData.name} | ${rowData.points} XP`}
                    </Text>
                    <TouchableOpacity
                      style={{
                        display:
                          myName !== roomMaster && myName !== rowData.name
                            ? 'none'
                            : 'flex',
                        alignSelf: 'flex-end',
                        marginRight: 0,
                        marginLeft: 'auto',
                        marginTop: 'auto',
                        marginBottom: 'auto',
                        justifyContent: 'center',
                      }}
                      onPress={() => {
                        this.quitKick(rowData);
                      }}
                    >
                      <ImageBackground
                        source={Images.btn}
                        style={{
                          width: 84,
                          height: 35,
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          isLoaded
                          isBold
                          style={{ fontSize: 18, textAlign: 'center' }}
                        >
                          {myName === rowData.name
                            ? I18n.t('quit')
                            : I18n.t('kick')}
                        </Text>
                      </ImageBackground>
                    </TouchableOpacity>
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
    return (
      <TabViewAnimated
        navigationState={this.state}
        renderScene={this.renderScene}
        renderHeader={this.renderHeader}
        onIndexChange={this.handleIndexChange}
        initialLayout={initialLayout}
      />
    );
  }
}
