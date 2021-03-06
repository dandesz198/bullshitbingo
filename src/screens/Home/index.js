import React from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  ListView,
  Modal,
  Alert,
  Image,
  Dimensions,
  BackHandler,
  StatusBar,
} from 'react-native';
import * as firebase from 'firebase';
import sha256 from 'crypto-js/sha256';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Text, TextInput, Onboarding, About } from '@components';
import { Images } from '@assets';

import styles from './styles';
import I18n from '../../i18n';
import {
  joinRoom,
  fetchFromDb,
  createRoom,
  hideOnboarding,
  updateName,
} from '../../actions';
import { createId } from '../../services';
import NavigationService from '../../config/navigationService';

const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // Data for the new room
      newRoomModalVisible: false,
      newRoomName: '',
      newRoomID: createId(),
      pw: '',
      pwAgain: '',

      // Data for joining room
      joinRoomModalVisible: false,
      joinRoomName: '',
      joinRoomID: '',
      joinMaster: '',
      roomPw: '',
      isNewRoomIDCorrect: true,
      joinPw: '',

      myName: props.user.myName,
      myNameWB: '',

      infoModalVisible: false,
    };
  }

  static propTypes = {
    user: PropTypes.object.isRequired,
    rooms: PropTypes.array,
    joinRoom: PropTypes.func.isRequired,
    hideOnboarding: PropTypes.func.isRequired,
    updateName: PropTypes.func.isRequired,
    createRoom: PropTypes.func.isRequired,
    fetchFromDb: PropTypes.func.isRequired,
    error: PropTypes.object,
  };

  static defaultProps = {
    rooms: [],
    error: null,
  };

  componentWillMount() {
    this.checkRooms();
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
  }

  componentDidUpdate(prevProps) {
    const { error } = this.props;
    if (prevProps.error !== error && error) {
      if (error.title) {
        Alert.alert(I18n.t(error.title), I18n.t(error.details));
      }
    }
  }

  onBackPress = () => {
    this.setState({
      joinRoomModalVisible: false,
      newRoomModalVisible: false,
      infoModalVisible: false,
    });
    return true;
  };

  checkRooms = () => {
    const { rooms, fetchFromDb } = this.props;
    rooms.map(element => fetchFromDb(element.roomID));
  };

  createRoom = async () => {
    const { pw, newRoomName, newRoomID } = this.state;
    const { createRoom } = this.props;

    await createRoom(newRoomID, newRoomName, pw);

    this.setState({
      newRoomModalVisible: false,
    });

    // Navigate to the new room's screen
    NavigationService.navigateTo('Room', {
      roomID: newRoomID,
    });

    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);

    // Create new room ID for the next room, empty the screen
    this.setState({
      pw: '',
      pwAgain: '',
      newRoomName: '',
      newRoomID: createId(),
    });
  };

  preJoin = () => {
    const { joinRoomID } = this.state;
    const thus = this;

    if (joinRoomID.length !== 6) {
      this.setState({
        isNewRoomIDCorrect: false,
      });
      return;
    }

    firebase
      .database()
      .ref(`rooms/${joinRoomID}/`)
      .once('value', async snap => {
        const value = snap.val();
        // Check if the room exists
        if (value === null || !value || typeof value === 'undefined') {
          thus.setState({
            isNewRoomIDCorrect: false,
          });
        } else {
          // Open the connection modal
          const { name, master, masterPw } = snap.val();
          thus.setState({
            joinRoomName: name,
            joinMaster: master,
            roomPw: masterPw,
            joinRoomModalVisible: true,
          });
        }
      });
  };

  // NEEDS TO BE REFACTORED - NTBR
  joinRoomConfirm = async () => {
    const { joinMaster, roomPw, joinPw, joinRoomID, myNameWB } = this.state;
    const { user, joinRoom, fetchFromDb, updateName } = this.props;
    const { myName } = user;

    if (myName.length === 0) {
      if (myNameWB.length > 0) {
        await updateName(myNameWB);
        await this.setState({
          myName: myNameWB,
          myNameWB: '',
        });
      } else {
        this.setState({
          joinRoomModalVisible: false,
        });
        Alert.alert(I18n.t('error'), I18n.t('empty_fields'), [
          {
            text: I18n.t('ok'),
            onPress: () =>
              this.setState({
                joinRoomModalVisible: true,
              }),
          },
        ]);
        return;
      }
    }

    // Check the password
    if (myName === joinMaster && roomPw !== sha256(joinPw)) {
      this.setState({
        joinRoomModalVisible: false,
      });
      Alert.alert(I18n.t('error'), I18n.t('wrong_password'), [
        {
          text: I18n.t('ok'),
          onPress: () =>
            this.setState({
              joinRoomModalVisible: true,
            }),
        },
      ]);
      return;
    }

    // Add the user to database
    joinRoom(joinRoomID);

    setTimeout(() => {
      fetchFromDb(joinRoomID);
    }, 1250);

    this.setState({
      joinRoomModalVisible: false,
    });

    this.setState({
      joinRoomID: '',
      joinPw: '',
      roomPw: '',
    });

    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
  };

  componentWillReceiveProps() {
    // this.deleteRoom(delete);
    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
  }

  // ============================== VIEWS =============================================================================================

  renderNewRoomModal = () => {
    const {
      newRoomModalVisible,
      myNameWB,
      newRoomName,
      pw,
      pwAgain,
      newRoomID,
    } = this.state;
    const { updateName, user } = this.props;
    const { myName } = user;
    return (
      <Modal
        animationType="slide"
        transparent={false}
        onRequestClose={() => this.setState({ newRoomModalVisible: false })}
        visible={newRoomModalVisible}
      >
        <ScrollView style={{ flex: 1, padding: 20, backgroundColor: 'white' }}>
          <Text
            isBold
            style={[styles.heading, { fontSize: 36, marginLeft: 0 }]}
          >
            {I18n.t('create_room')}
          </Text>
          {myName.length < 1 && (
            <View>
              <TextInput
                style={{ padding: 10 }}
                placeholder={I18n.t('your_name')}
                onChangeText={myNameWB => this.setState({ myNameWB })}
                value={myNameWB}
              />
              <Image source={Images.line_long} />
              {myNameWB.length < 1 && (
                <Text
                  isBold
                  style={{
                    fontSize: 16,
                    color: '#ee5253',
                    marginTop: 7.5,
                  }}
                >
                  {I18n.t('no_empty_please')}
                </Text>
              )}
            </View>
          )}
          <TextInput
            style={{ padding: 10 }}
            placeholder={I18n.t('name_of_room')}
            onChangeText={newRoomName => this.setState({ newRoomName })}
            value={newRoomName}
          />
          <Image source={Images.line_long} />
          {newRoomName.length === 0 && (
            <Text
              isBold
              style={{
                color: '#ee5253',
                fontSize: 16,
                marginTop: 7.5,
              }}
            >
              {I18n.t('no_empty_please')}
            </Text>
          )}
          <Text isBold style={[styles.p, { marginTop: 20 }]}>
            {I18n.t('password_lock')}
          </Text>
          <TextInput
            style={{ padding: 10 }}
            secureTextEntry
            placeholder={I18n.t('password')}
            onChangeText={pw => this.setState({ pw })}
            value={pw}
          />
          <Image source={Images.line_long} />
          <TextInput
            style={{ padding: 10 }}
            secureTextEntry
            placeholder={I18n.t('password_again')}
            onChangeText={pwAgain => this.setState({ pwAgain })}
            value={pwAgain}
          />
          <Image source={Images.line_long} />
          {pw !== pwAgain && (
            <Text
              isBold
              style={{
                color: '#ee5253',
                fontSize: 16,
              }}
            >
              {I18n.t('password_error')}
            </Text>
          )}
          <View style={{ flexDirection: 'column' }}>
            <Text isBold style={[styles.p, { marginTop: 20 }]}>
              {I18n.t('room_pin')}
            </Text>
            <Text isBold style={styles.h2}>
              {newRoomID}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignContent: 'center',
              justifyContent: 'center',
              marginVertical: 30,
            }}
          >
            <View style={{ flexDirection: 'column', marginRight: 25 }}>
              <Image
                source={Images.create_child}
                style={{ height: 102, width: 140, marginBottom: -2.5 }}
              />
              <Button
                onPress={async () => {
                  if (myNameWB.length > 0) {
                    await updateName(myNameWB);
                    await this.setState({
                      myName: myNameWB,
                      myNameWB: '',
                    });
                  }
                  this.createRoom();
                }}
                isDisabled={
                  !!(
                    (myNameWB.length === 0 && myName.length === 0) ||
                    pw.length === 0 ||
                    pwAgain.length === 0 ||
                    newRoomName.length === 0 ||
                    pw !== pwAgain
                  )
                }
                text={I18n.t('create')}
              />
            </View>
            <Button
              onPress={() => {
                this.setState({ newRoomModalVisible: false });
              }}
              style={{ marginTop: 99.5 }}
              text={I18n.t('cancel')}
            />
          </View>
        </ScrollView>
      </Modal>
    );
  };

  renderJoinRoomModal = () => {
    const {
      joinRoomModalVisible,
      myName,
      myNameWB,
      joinRoomName,
      joinMaster,
      joinPw,
    } = this.state;
    return (
      <Modal
        animationType="slide"
        transparent={false}
        onRequestClose={() => this.setState({ joinRoomModalVisible: false })}
        visible={joinRoomModalVisible}
      >
        <ScrollView style={{ flex: 1, backgroundColor: 'white', padding: 20 }}>
          <Text
            isBold
            style={[styles.heading, { fontSize: 40, marginBottom: 20 }]}
          >
            {`${I18n.t('join')} "${joinRoomName}"?`}
          </Text>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'column' }}>
              {myName.length === 0 && (
                <View
                  style={{
                    marginLeft: 20,
                  }}
                >
                  <TextInput
                    style={{ padding: 10 }}
                    placeholder={I18n.t('your_name')}
                    onChangeText={myNameWB => this.setState({ myNameWB })}
                    value={myNameWB}
                  />
                  <Image source={Images.line_long} />
                  {myNameWB.length === 0 && (
                    <Text
                      isBold
                      style={{
                        color: '#ee5253',
                        fontSize: 16,
                        marginTop: 7.5,
                      }}
                    >
                      {I18n.t('no_empty_please')}
                    </Text>
                  )}
                </View>
              )}
              {myName === joinMaster && (
                <View
                  style={{
                    marginLeft: 20,
                  }}
                >
                  <TextInput
                    style={{ padding: 10 }}
                    secureTextEntry
                    placeholder={I18n.t('room_master_password')}
                    onChangeText={joinPw => this.setState({ joinPw })}
                    value={joinPw}
                  />
                  <Image source={Images.line_long} />
                  {joinPw.length === 0 && (
                    <Text
                      isBold
                      style={{
                        color: '#ee5253',
                        fontSize: 16,
                        marginTop: 7.5,
                      }}
                    >
                      {I18n.t('no_empty_please')}
                    </Text>
                  )}
                </View>
              )}
            </View>
            <Image
              source={Images.join_bg}
              style={{
                height: Dimensions.get('window').height * (35 / 100),
                width: Dimensions.get('window').height * (35 / 100),
                marginVertical: 20,
                alignSelf: 'center',
              }}
            />
            <View
              style={[
                styles.card,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'center',
                },
              ]}
            >
              <View style={[styles.button, { flex: 1, marginRight: 25 }]}>
                <Button
                  onPress={() => this.joinRoomConfirm()}
                  text={I18n.t('join')}
                />
              </View>
              <Button
                onPress={() => {
                  this.setState({ joinRoomModalVisible: false });
                }}
                text={I18n.t('cancel')}
              />
            </View>
          </View>
        </ScrollView>
      </Modal>
    );
  };

  renderInfoModal = () => {
    const { infoModalVisible } = this.state;

    return (
      <Modal
        animationType="slide"
        transparent={false}
        onRequestClose={() => this.setState({ infoModalVisible: false })}
        visible={infoModalVisible}
      >
        <About close={() => this.setState({ infoModalVisible: false })} />
      </Modal>
    );
  };

  render() {
    const { isNewRoomIDCorrect, joinRoomID } = this.state;
    const { user, rooms, hideOnboarding } = this.props;
    if (user.isFirst) {
      return <Onboarding hideOnboarding={() => hideOnboarding()} />;
    }
    return (
      <View style={[styles.container, { backgroundColor: 'white' }]}>
        <StatusBar barStyle="dark-content" />
        {this.renderNewRoomModal()}
        {this.renderJoinRoomModal()}
        {this.renderInfoModal()}
        <ScrollView style={{ flex: 1 }}>
          <View style={{ marginTop: 20, flexDirection: 'row' }}>
            <Text isBold style={styles.welcome}>
              {I18n.t('bullshit_bingo')}
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 'auto',
                marginBottom: 5,
                marginLeft: 'auto',
                marginRight: 20,
              }}
              onPress={() => {
                this.setState({ infoModalVisible: true });
              }}
            >
              <Text isBold style={{ fontSize: 16 }}>
                0.16 [i]
              </Text>
            </TouchableOpacity>
          </View>
          <Button
            onPress={() => {
              this.setState({ newRoomModalVisible: true });
            }}
            style={{ marginTop: 10 }}
            isWide
            text={I18n.t('create_room')}
          />
          <Text isBold style={styles.heading}>
            {I18n.t('join_room')}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <Image
              source={Images.home_child}
              style={{
                height: 180,
                width: 105,
                marginTop: 10,
                marginLeft: 0,
                marginRight: 'auto',
              }}
            />
            <View
              style={{
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 'auto',
                marginBottom: 'auto',
                marginRight: 'auto',
                marginLeft: 'auto',
              }}
            >
              <View
                style={{
                  height: 60,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TextInput
                  style={{ fontSize: 24 }}
                  placeholder={I18n.t('room_pin')}
                  keyboardType="numeric"
                  onChangeText={joinRoomID =>
                    this.setState({ joinRoomID, isNewRoomIDCorrect: true })
                  }
                  value={joinRoomID}
                />
                <Image source={Images.line_short} style={{ width: 140 }} />
              </View>
              {!isNewRoomIDCorrect && (
                <Text
                  isBold
                  style={{
                    color: '#ee5253',
                    fontSize: 16,
                  }}
                >
                  {I18n.t('check_pin')}
                </Text>
              )}
              <Button
                onPress={() => {
                  this.preJoin();
                }}
                style={{ marginTop: 10, marginBottom: 'auto' }}
                text={I18n.t('join')}
              />
            </View>
          </View>
          <Text isBold style={styles.heading}>
            {I18n.t('my_rooms')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ListView
              dataSource={ds.cloneWithRows(rooms)}
              enableEmptySections
              renderRow={rowData => (
                <TouchableOpacity
                  style={{ padding: 2.5, marginLeft: 20 }}
                  onPress={() => {
                    NavigationService.navigateTo('Room', {
                      roomID: rowData.roomID,
                    });
                    BackHandler.removeEventListener(
                      'hardwareBackPress',
                      this.onBackPress
                    );
                  }}
                >
                  <Text isBold style={styles.roomList}>
                    {rowData.name}
                  </Text>
                  <Image source={Images.line_short} />
                </TouchableOpacity>
              )}
            />
            <Image
              source={Images.home_grass}
              style={{ width: 45, height: 45, marginRight: 30 }}
            />
          </View>
        </ScrollView>
      </View>
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
    hideOnboarding,
    createRoom,
    joinRoom,
    updateName,
    fetchFromDb,
  }
)(Home);
