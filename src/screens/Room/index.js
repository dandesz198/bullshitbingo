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
import { TabViewAnimated, TabBar } from 'react-native-tab-view';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Card, Text } from '@components';
import { Images } from '@assets';

import styles from './styles';
import I18n from '../../i18n';
import NavigationService from '../../config/navigationService';
import {
  createMatch,
  deleteMatch,
  deleteRoomFromDb,
  kick,
  quitRoom,
} from '../../actions';
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
    const { name, master } = props.rooms.find(room => room.roomID === roomID);
    this.state = {
      index: 0,
      routes: [
        { key: '1', title: I18n.t('matches') },
        { key: '2', title: I18n.t('room_info') },
      ],
      value: 0,

      roomID,
      name,
      master,

      newMatchText: '',
    };
  }

  static propTypes = {
    navigation: PropTypes.any.isRequired,
    user: PropTypes.object.isRequired,
    createMatch: PropTypes.func.isRequired,
    deleteRoomFromDb: PropTypes.func.isRequired,
    deleteMatch: PropTypes.func.isRequired,
    kick: PropTypes.func.isRequired,
    quitRoom: PropTypes.func.isRequired,
    rooms: PropTypes.array.isRequired,
    matches: PropTypes.array,
    error: PropTypes.object,
  };

  static defaultProps = {
    error: null,
    matches: [],
  };

  componentDidMount() {
    setTimeout(() => {
      this.scrollView.scrollTo({ x: 0, y: 120, animated: false });
    }, 1);
  }

  componentDidUpdate(prevProps) {
    const { props } = this;
    if (prevProps.error !== props.error && props.error) {
      Alert.alert(I18n.t(props.error.title), I18n.t(props.error.details));
    }
  }

  createMatch = () => {
    const { newMatchText, roomID } = this.state;
    const { user, createMatch } = this.props;
    const { myName } = user;
    const match = {
      roomID,
      name: newMatchText,
      master: myName,
      matchID: `room${roomID}_match${newId()}`,
    };
    createMatch(match);
  };

  quitKick = rowData => {
    const { name, master, roomID } = this.state;
    const { user, navigation, kick, quitRoom, deleteRoomFromDb } = this.props;
    const { myName } = user;
    Alert.alert(
      I18n.t('are_you_sure'),
      myName === rowData.name
        ? `${I18n.t('really_quit')} ${name}? ${I18n.t('rejoin')}`
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
            // NEEDS TO BE REFACTORED - NTBR
            // Determine if the player is the match master
            if (myName === master) {
              // If match master AND kicking itself
              if (myName === rowData.name) {
                // But you are the match master - quitting will delete the match
                Alert.alert(
                  I18n.t('are_you_sure'),
                  I18n.t('matchmaster_delete'),
                  [
                    {
                      text: I18n.t('cancel'),
                      onPress: () => console.log('Cancel'),
                      style: 'cancel',
                    },
                    {
                      text: I18n.t('matchmaster_quit_ok'),
                      onPress: () => {
                        deleteRoomFromDb(roomID);
                        navigation.goBack();
                      },
                      style: 'destructive',
                    },
                  ]
                );
              } else {
                // Since it's not kicking itself, they can kick the player
                kick(roomID, rowData.name);
              }
            } else if (rowData.name === myName) {
              // Quit room
              quitRoom(roomID);
              navigation.goBack();
            } else {
              // Can't kick others
              Alert.alert(I18n.t('error'), I18n.t('kick_error'), [
                {
                  text: I18n.t('ok'),
                  onPress: () => console.log('Cancel'),
                  style: 'cancel',
                },
              ]);
            }
          },
          style: 'destructive',
        },
      ]
    );
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
    const { newMatchText, name, roomID, master } = this.state;
    const { user, matches, rooms, deleteMatch } = this.props;
    const { myName } = user;
    const filteredMatches = matches.filter(match => match.roomID === roomID);
    const { members } = rooms.find(room => room.roomID === roomID);
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
              dataSource={ds.cloneWithRows(filteredMatches)}
              enableEmptySections
              style={[
                styles.membersList,
                { minHeight: Dimensions.get('window').height },
              ]}
              renderRow={rowData => (
                <Card
                  matchName={name}
                  cardText={rowData.name}
                  creatorName={rowData.master}
                  bgColor="white"
                  isMaster={rowData.master === myName || master === myName}
                  onVotePress={() => {
                    NavigationService.navigateTo('Match', {
                      matchName: rowData.name,
                      roomID,
                      matchID: rowData.matchID,
                      matchMaster: rowData.master,
                      master,
                    });
                  }}
                  onDeletePress={() => {
                    Alert.alert(
                      I18n.t('are_you_sure'),
                      `${I18n.t('del_match')}: "${rowData.name}". ${I18n.t(
                        'irreversible'
                      )}`,
                      [
                        {
                          text: I18n.t('delete_it'),
                          onPress: () => {
                            deleteMatch(roomID, rowData.matchID);
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
                  {name}
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
              {master}
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
                members.sort(
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
                    <Button
                      onPress={() => {
                        this.quitKick(rowData);
                      }}
                      style={{
                        alignSelf: 'flex-end',
                        display:
                          myName === master || myName === rowData.name
                            ? 'flex'
                            : 'none',
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

const mapStateToProps = ({ rooms, matches, user, error }) => ({
  rooms,
  matches,
  user,
  error,
});

export default connect(
  mapStateToProps,
  {
    createMatch,
    deleteMatch,
    deleteRoomFromDb,
    kick,
    quitRoom,
  }
)(Room);
