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
  Linking,
  BackHandler,
  Vibration,
  StatusBar,
} from 'react-native';
import * as firebase from 'firebase';
import sha256 from 'crypto-js/sha256';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Text, TextInput, Link } from '@components';
import { Images } from '@assets';

import styles from './styles';
import I18n from '../../i18n';
import {
  createRoom,
  hideOnboarding,
  updateName,
  deleteRoom,
  checkRoom,
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
    hideOnboarding: PropTypes.func.isRequired,
    updateName: PropTypes.func.isRequired,
    createRoom: PropTypes.func.isRequired,
    checkRoom: PropTypes.func.isRequired,
    deleteRoom: PropTypes.func.isRequired,
  };

  static defaultProps = {
    rooms: [],
  };

  componentWillMount() {
    this.checkRooms();
  }

  componentDidMount() {
    const { deleteRoom, user } = this.props;
    const { myName } = user;

    // Add the user kicker listener
    firebase
      .database()
      .ref(`users/${myName}/rooms`)
      .on('child_removed', async snap => {
        deleteRoom(snap().val);
        NavigationService.navigateTo('Home');
        Alert.alert(I18n.t('kicked'), I18n.t('kicked_desc'));
      });

    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
  }

  onBackPress = () => {
    this.setState({
      joinRoomModalVisible: false,
      newRoomModalVisible: false,
      infoModalVisible: false,
    });
    return true;
  };

  checkRooms = async () => {
    const { rooms, checkRoom } = this.props;
    rooms.map(element => checkRoom(element.roomID));
  };

  createRoom = async () => {
    const { myNameWB, pw, pwAgain, newRoomName, newRoomID } = this.state;
    const { createRoom, user } = this.props;
    const { myName } = user;

    if (
      (myNameWB.length === 0 && myName.length === 0) ||
      pw.length === 0 ||
      pwAgain.length === 0 ||
      newRoomName.length === 0
    ) {
      Vibration.vibrate();
      return;
    }

    // Check the password
    if (pw !== pwAgain) {
      this.setState({
        newRoomModalVisible: false,
      });
      Vibration.vibrate();
      Alert.alert(I18n.t('error'), I18n.t('password_error'), [
        {
          text: I18n.t('ok'),
          onPress: () =>
            this.setState({
              newRoomModalVisible: true,
            }),
        },
      ]);
      return;
    }

    // Upload the room itself to database
    await createRoom({
      name: newRoomName,
      master: myName,
      masterPw: sha256(pw),
      roomID: newRoomID,
      matches: [],
    });

    this.setState({
      newRoomModalVisible: false,
    });

    // Navigate to the new room's screen
    NavigationService.navigateTo('Room', {
      roomName: newRoomName,
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
    let { newRoomName } = this.state;
    const thus = this;

    if (joinRoomID.length < 6) {
      this.setState({
        isNewRoomIDCorrect: false,
      });
      Vibration.vibrate();
      return;
    }

    // Get the name and the master's name of the new room
    firebase
      .database()
      .ref(`rooms/${joinRoomID}`)
      .once('value', snap => {
        if (
          snap.val() === null ||
          !snap.val() ||
          typeof snap.val() === 'undefined'
        ) {
          thus.setState({
            isNewRoomIDCorrect: false,
          });
          Vibration.vibrate();
          return;
        }

        // Check if the room exists
        if (newRoomName.length > 1 && newRoomName !== 'null') {
          let masterName = JSON.stringify(snap.val().master);
          let masterPw = JSON.stringify(snap.val().masterPw);

          // Remove "
          newRoomName = newRoomName.slice(1, -1);
          masterName = masterName.slice(1, -1);
          masterPw = masterPw.slice(1, -1);

          // Open the connection modal
          thus.setState({
            joinRoomName: newRoomName,
            joinMaster: masterName,
            roomPw: masterPw,
            joinRoomModalVisible: true,
          });
        } else {
          Alert.alert(I18n.t('error'), I18n.t('prejoin_error'));
          Vibration.vibrate();
        }
      });
  };

  joinRoom = async () => {
    const { joinMaster, roomPw, joinPw, joinRoomID, joinRoomName } = this.state;
    const { user, joinRoom } = this.props;
    const { myName } = user;
    if (myName.length === 0) {
      this.setState({
        joinRoomModalVisible: false,
      });
      Vibration.vibrate();
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

    // Check the password
    if (myName === joinMaster && roomPw !== sha256(joinPw)) {
      Vibration.vibrate();
      Alert.alert(I18n.t('error'), I18n.t('wrong_password'));
      return;
    }

    // Add the user to database
    joinRoom(joinRoomID);

    this.setState({
      joinRoomModalVisible: false,
    });

    // Navigate to the room
    NavigationService.navigateTo('Room', {
      roomName: joinRoomName,
      roomID: joinRoomID,
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
                    newRoomName.length === 0
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
                  onPress={async () => {
                    if (myNameWB.length > 0) {
                      await this.setState({
                        myName: myNameWB,
                        myNameWB: '',
                      });
                    }
                    this.joinRoom();
                  }}
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
        <ScrollView style={{ flex: 1, padding: 25 }}>
          <Text isBold style={{ fontSize: 40, marginTop: 20 }}>
            {I18n.t('bullshit_bingo')}
          </Text>
          <Text isBold={false} style={{ fontSize: 20 }}>
            {`${I18n.t('desc_1')}${'\n'}${'\n'}${I18n.t(
              'desc_2'
            )}${'\n'}${I18n.t('desc_3')}`}
          </Text>
          <Text isBold style={{ fontSize: 40, marginTop: 15 }}>
            {I18n.t('rules')}
          </Text>
          <Text isBold={false} style={{ fontSize: 20 }}>
            {`• ${I18n.t('rule_1')}${'\n'}• ${I18n.t(
              'rule_2'
            )}${'\n'}• ${I18n.t('rule_3')}${'\n'}• ${I18n.t(
              'rule_4'
            )}${'\n'}• ${I18n.t('rule_5')}${'\n'}• ${I18n.t('rule_6')}`}
          </Text>
          <Text isBold style={{ fontSize: 40, marginTop: 15 }}>
            {I18n.t('creator')}
          </Text>
          <Text isBold style={{ fontSize: 20 }}>
            {I18n.t('open_source')}
          </Text>
          <Link
            text={I18n.t('github')}
            url="https://github.com/dandesz198/bullshitbingo"
          />
          <Text isBold style={{ fontSize: 20, marginTop: 10 }}>
            {I18n.t('daniel_g')}
          </Text>
          <Link text="GitHub" url="https://github.com/dandesz198" />
          <Link text="Facebook" url="https://fb.me/dandesz198" />
          <Link text="Twitter" url="https://twitter.com/dandesz198" />
          <Link text="LinkedIn" url="https://linkedin.com/in/dandesz198" />
          <Text isBold style={{ fontSize: 40, marginTop: 15 }}>
            {I18n.t('contributors')}
          </Text>
          <Text isBold style={{ fontSize: 20 }}>
            {I18n.t('peter_h')}
          </Text>
          <Link text="GitHub" url="https://github.com/razor97" />
          <Link text="Facebook" url="https://fb.me/hajdupetke" />
          <Link text="Twitter" url="https://twitter.com/hajdupetke" />
          <Text isBold style={{ fontSize: 40, marginTop: 15 }}>
            {I18n.t('legal')}
          </Text>
          <Text isBold={false} style={{ fontSize: 16 }}>
            {`${I18n.t('font_family')}: Cabin Sketch${'\n'}${I18n.t(
              'illustrator'
            )} : Freepik`}
          </Text>
          <Link
            text={I18n.t('link_to_vector')}
            url="https://www.flaticon.com/free-icon/poo_720965"
          />
          <Text isBold={false} style={{ fontSize: 16 }}>
            {`${I18n.t('poop')}: Flaticon (by Freepik)`}
          </Text>
          <Link
            text={I18n.t('link_to_poop')}
            url="https://www.freepik.com/free-vector/sketchy-children_797063.htm"
          />
          <TouchableOpacity
            style={{ marginLeft: 'auto', marginRight: 'auto', marginTop: 15 }}
            onPress={() => {
              Linking.openURL('https://paypal.me/dandesz198');
            }}
          >
            <Image source={Images.coffee} style={{ height: 45, width: 225 }} />
          </TouchableOpacity>
          <Text
            isBold
            style={[
              styles.p,
              { fontSize: 16, textAlign: 'center', marginTop: 5 },
            ]}
          >
            {I18n.t('server_donate')}
          </Text>
          <Button
            onPress={() => {
              this.setState({ infoModalVisible: false });
            }}
            style={{
              marginTop: 20,
              marginBottom: 40,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
            isWide
            text={I18n.t('close')}
          />
        </ScrollView>
      </Modal>
    );
  };

  renderOnboarding = () => {
    const { hideOnboarding } = this.props;
    return (
      <ScrollView style={{ flex: 1 }} pagingEnabled horizontal vertical={false}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.onboardContainter}>
          <Image
            source={Images.icon}
            style={{ width: 125, height: 125, marginBottom: 20 }}
          />
          <Text isBold style={{ fontSize: 30, textAlign: 'center' }}>
            {I18n.t('onboard_welcome')}
          </Text>
          <Text
            isBold
            style={{ fontSize: 20, textAlign: 'center', marginTop: 5 }}
          >
            {I18n.t('onboard_welcome_desc')}
          </Text>
          <Text
            isBold={false}
            style={{ fontSize: 30, textAlign: 'center', marginTop: 20 }}
          >
            {I18n.t('onboard_welcome_swipe')}
          </Text>
        </View>
        <View style={styles.onboardContainter}>
          <Text isBold style={{ fontSize: 30, textAlign: 'center' }}>
            {I18n.t('onboard_rooms')}
          </Text>
          <Text isBold style={{ fontSize: 20, textAlign: 'center' }}>
            {I18n.t('onboard_rooms_desc')}
          </Text>
        </View>
        <View style={[styles.onboardContainter, { padding: 0 }]}>
          <View
            style={[
              styles.onboardContainter,
              { marginTop: 'auto', marginBottom: 'auto' },
            ]}
          >
            <Text isBold style={{ fontSize: 30, textAlign: 'center' }}>
              {I18n.t('onboard_matches')}
            </Text>
            <Text isBold style={{ fontSize: 20, textAlign: 'center' }}>
              {I18n.t('onboard_matches_desc')}
            </Text>
          </View>
          <Image
            source={Images.create_child}
            style={{
              width: 120,
              height: 87,
              marginTop: 'auto',
              marginBottom: 0,
            }}
          />
        </View>
        <View style={styles.onboardContainter}>
          <Image
            source={Images.tutorial_card}
            style={{ width: 300, height: 125, marginBottom: 20 }}
          />
          <Text isBold style={{ fontSize: 30, textAlign: 'center' }}>
            {I18n.t('onboard_cards')}
          </Text>
          <Text isBold style={{ fontSize: 20, textAlign: 'center' }}>
            {I18n.t('onboard_cards_desc')}
          </Text>
        </View>
        <View style={styles.onboardContainter}>
          <Image
            source={Images.firework}
            style={{ width: 125, height: 125, marginBottom: 20 }}
          />
          <Text isBold style={{ fontSize: 30, textAlign: 'center' }}>
            {I18n.t('onboard_bingo')}
          </Text>
          <Text isBold style={{ fontSize: 20, textAlign: 'center' }}>
            {I18n.t('onboard_bingo_desc')}
          </Text>
        </View>
        <View style={styles.onboardContainter}>
          <Text isBold style={{ fontSize: 30, textAlign: 'center' }}>
            {I18n.t('onboard_start')}
          </Text>
          <Text isBold style={{ fontSize: 20, textAlign: 'center' }}>
            {I18n.t('onboard_start_desc')}
          </Text>
          <Button
            onPress={() => {
              hideOnboarding();
            }}
            style={{ marginTop: 15 }}
            text={I18n.t('onboard_start_btn')}
          />
          <Image
            source={Images.add_child}
            style={{ width: 70, height: 59, marginTop: -2.5 }}
          />
        </View>
      </ScrollView>
    );
  };

  render() {
    const { isNewRoomIDCorrect, joinRoomID } = this.state;
    const { user, rooms } = this.props;
    if (user.isFirst) {
      return this.renderOnboarding();
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
                0.15 [i]
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
                  onChangeText={joinRoomID => this.setState({ joinRoomID })}
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
                      roomName: rowData.name,
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

const mapStateToProps = ({ rooms, user }) => ({
  rooms,
  user,
});

export default connect(
  mapStateToProps,
  {
    hideOnboarding,
    createRoom,
    updateName,
    deleteRoom,
    checkRoom,
  }
)(Home);
