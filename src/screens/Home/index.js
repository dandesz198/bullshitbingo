import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ListView,
  Modal,
  Alert,
  AsyncStorage,
  Image,
  Dimensions,
  Linking,
  BackHandler,
  Vibration,
  ImageBackground,
  Platform,
  StatusBar,
} from 'react-native';
import * as firebase from 'firebase';
import sha256 from 'crypto-js/sha256';
import { Analytics, PageHit, Event } from 'expo-analytics';
import { Expo, Font } from 'expo';
import { Link, Text } from '@components';
import Images from '@assets';
import styles from './styles';

const Environment = require('../../config/environment');

const config = {
  apiKey: Environment.apiKey,
  authDomain: Environment.authDomain,
  databaseURL: Environment.databaseURL,
  projectId: Environment.projectId,
  storageBucket: Environment.storageBucket,
  messagingSenderId: Environment.messagingSenderId,
};

const analytics = new Analytics(Environment.analytics);

const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });

export default class Home extends React.Component {
  state = {
    games: [],

    // Data for the new room
    newGameModalVisible: false,
    newGameName: '',
    newGameID: Math.floor(Math.random() * 899999 + 100000).toString(),
    pw: '',
    pwAgain: '',

    // Data for joining game
    joinGameModalVisible: false,
    joinGameName: '',
    joingameId: '',
    joinMaster: '',
    roomPw: '',
    isNewGameIDCorrect: true,
    joinPw: '',

    myName: '',
    myNameWB: '',

    infoModalVisible: false,

    isFirstOpen: false,

    fontsLoaded: false,
  };

  returnData(id) {
    this.deleteGame(id);
  }

  componentWillMount() {
    // Initialize Firebase
    firebase.initializeApp(config);
    this.newId();
    this.loadGames();
  }

  async componentDidMount() {
    // Starts the first loop in color changing
    await Font.loadAsync({
      'cabin-sketch': require('./fonts/CabinSketch-Regular.ttf'),
      'cabin-sketch-bold': require('./fonts/CabinSketch-Bold.ttf'),
    });

    this.setState({
      fontsLoaded: true,
    });

    Expo.ScreenOrientation.allow(Expo.ScreenOrientation.Orientation.PORTRAIT);

    try {
      const value = await AsyncStorage.getItem('@MySuperStore:isFirst');
      if (value !== null) {
        // We have data
        this.setState({
          isFirstOpen: false,
        });
      } else {
        this.setState({
          isFirstOpen: true,
        });
      }
    } catch (error) {
      // Error retrieving data
      console.log(error);
    }

    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);

    analytics.hit(new PageHit('Home'));

    try {
      const update = await Expo.Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Expo.Updates.fetchUpdateAsync();
        Vibration.vibrate();
        this.setState({
          joinGameModalVisible: false,
          newGameModalVisible: false,
          infoModalVisible: false,
        });
        Alert.alert(
          'Update avaliable',
          "Please update the app in order to get the latest Bullshit Bingo experience. (It won't take more than 5 seconds, I swear)",
          [
            {
              text: 'OK',
              onPress: () => Expo.Updates.reload(),
            },
            {
              text: 'GTFO',
              onPress: () => console.log('no update for you'),
            },
          ]
        );
      }
    } catch (e) {
      // handle or log error
    }

    // Save the games with 2s delay
    setTimeout(() => {
      this.saveGames();
    }, 2000);
  }

  newId() {
    const { newGameId } = this.state;
    const thus = this;
    firebase
      .database()
      .ref(`games/${newGameId}`)
      .once('value', snap => {
        // Check if the game exists
        if (typeof snap.val() !== 'undefined' && snap.val() !== null) {
          thus.setState({
            newGameID: Math.floor(Math.random() * 899999 + 100000).toString(),
          });
          thus.newId();
        }
      });
  }

  onBackPress() {
    this.setState({
      joinGameModalVisible: false,
      newGameModalVisible: false,
      infoModalVisible: false,
    });
    return true;
  }

  // Save data to the AsyncStorage
  async saveGames() {
    const { games } = this.state;
    // Save games to AsyncStorage
    try {
      await AsyncStorage.setItem('@MySuperStore:games', JSON.stringify(games));
    } catch (error) {
      // Error saving data
      console.log(error);
    }
  }

  // Load data from the AsyncStorage
  async loadGames() {
    const { members, myName } = this.state;
    // Get name from AsyncStorage
    try {
      const value = await AsyncStorage.getItem('@MySuperStore:name');
      if (value !== null) {
        // We have data
        this.setState({
          myName: value,
        });
      }
    } catch (error) {
      // Error retrieving data
      console.log(error);
    }

    setTimeout(async () => {
      // Get games from AsyncStorage
      try {
        const value = await AsyncStorage.getItem('@MySuperStore:games');
        if (value !== null) {
          // We have data
          const array = JSON.parse(value);
          const thus = this;

          array.forEach(async element => {
            // Remove the " from the start and end of the string
            if (element.name[0] === '"') {
              element.name = element.name.slice(1, -1);
            }

            // Check if room still exists
            firebase
              .database()
              .ref(`games/${element.id}/members/`)
              .once('value')
              .then(snap => {
                let count = 0;
                if (snap.val()) {
                  const members = Object.values(snap.val());
                  members.forEach(lm => {
                    if (lm === myName) {
                      count += 1;
                    }
                  });
                } else {
                  thus.deleteGame(element.name);
                }

                // If member even exists
                if (members) {
                  // If room doesn't exist or player is kicked
                  if (members.length < 0 || count <= 0) {
                    thus.deleteGame(element.name);
                  }
                } else {
                  thus.deleteGame(element.name);
                }
              });
          });
          this.setState({
            games: array,
          });
        }
      } catch (error) {
        // Error retrieving data
        console.log(error);
      }
    }, 500);
  }

  async createRoom() {
    const {
      myNameWB,
      myName,
      pw,
      pwAgain,
      newGameName,
      newGameID,
      games,
    } = this.state;
    const { navigation } = this.props;

    if (
      (myNameWB.length === 0 && myName.length === 0) ||
      pw.length === 0 ||
      pwAgain.length === 0 ||
      newGameName.length === 0
    ) {
      Vibration.vibrate();
      return;
    }

    this.saveName();

    // Check the password
    if (pw !== pwAgain) {
      this.setState({
        newGameModalVisible: false,
      });
      Vibration.vibrate();
      Alert.alert('Error', "The passowrds don't look the same for me.", [
        {
          text: 'OK',
          onPress: () =>
            this.setState({
              newGameModalVisible: true,
            }),
        },
      ]);
      return;
    }

    // Upload the game itself to Firebase
    await firebase
      .database()
      .ref(`games/${newGameID}`)
      .set({
        name: newGameName,
        master: myName,
        masterPw: sha256(pw),
        members: [myName],
      });

    // Add the new game to the Games array (rendered in 'My rooms' section)
    const game = {
      id: newGameID,
      name: newGameName,
    };

    games.push(game);

    this.setState({
      games,
      newGameModalVisible: false,
    });

    // Navigate to the new game's screen
    navigation.navigate('Room', {
      gameName: newGameName,
      gameId: newGameID,
      myName,
      returnData: this.returnData.bind(this),
    });
    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);

    // Save the new game to AsyncStorage
    this.saveGames();

    // Create new game ID for the next game, empty the screen
    this.setState({
      pw: '',
      pwAgain: '',
      newGameName: '',
      newGameID: Math.floor(Math.random() * 899999 + 100000).toString(),
    });

    analytics.event(new Event('Createroom'));
  }

  preJoin() {
    const { joingameId } = this.state;
    let { newGameName } = this.state;
    const thus = this;

    if (joingameId.length < 6) {
      this.setState({
        isNewGameIDCorrect: false,
      });
      Vibration.vibrate();
      return;
    }

    // Get the name and the master's name of the new room
    firebase
      .database()
      .ref(`games/${joingameId}`)
      .once('value', snap => {
        if (
          snap.val() === null ||
          !snap.val() ||
          typeof snap.val() === 'undefined'
        ) {
          thus.setState({
            isNewGameIDCorrect: false,
          });
          Vibration.vibrate();
          return;
        }

        // Check if the game exists
        if (newGameName.length > 1 && newGameName !== 'null') {
          let masterName = JSON.stringify(snap.val().master);
          let masterPw = JSON.stringify(snap.val().masterPw);

          // Remove "
          newGameName = newGameName.slice(1, -1);
          masterName = masterName.slice(1, -1);
          masterPw = masterPw.slice(1, -1);

          // Open the connection modal
          thus.setState({
            joinGameName: newGameName,
            joinMaster: masterName,
            roomPw: masterPw,
            joinGameModalVisible: true,
          });
        } else {
          Alert.alert(
            'Error',
            'Something bad happened (maybe). Please check the game PIN and/or try again later.'
          );
          Vibration.vibrate();
        }
      });
  }

  async joinRoom() {
    const {
      myName,
      joinMaster,
      roomPw,
      joinPw,
      joingameId,
      joinGameName,
      games,
    } = this.state;
    const { navigation } = this.props;
    if (myName.length === 0) {
      this.setState({
        joinGameModalVisible: false,
      });
      Vibration.vibrate();
      Alert.alert(
        'Error',
        'I saw terrible things... Empty fields. Please fill in the form to continue.',
        [
          {
            text: 'OK',
            onPress: () =>
              this.setState({
                joinGameModalVisible: true,
              }),
          },
        ]
      );
      return;
    }

    this.saveName();

    // Check the password
    if (myName === joinMaster && roomPw !== sha256(joinPw)) {
      Vibration.vibrate();
      Alert.alert('Error', 'The password is incorrect.');
      return;
    }

    // Add the user to Firebase
    await firebase
      .database()
      .ref(`games/${joingameId}/members/`)
      .once('value', snap => {
        const members = Object.values(snap.val());
        if (members.indexOf(myName) === -1) {
          firebase
            .database()
            .ref(`games/${joingameId}/members/`)
            .push(myName);
        }
      });

    // Add the new game to the games array (rendered in the 'My rooms' section in Home.js)
    const game = {
      id: joingameId,
      name: joinGameName,
    };
    let alreadyAdded = false;

    games.forEach(element => {
      if (element.id === joingameId) {
        alreadyAdded = true;
      }
    });

    if (!alreadyAdded) {
      games.push(game);
    }

    this.setState({
      joinGameModalVisible: false,
      games,
    });

    // Navigate to the game
    navigation.navigate('Room', {
      gameName: joinGameName,
      gameId: joingameId,
      myName,
      returnData: this.returnData.bind(this),
    });

    this.setState({
      joingameId: '',
      joinPw: '',
      roomPw: '',
    });

    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);

    // Save to AsyncStorage
    this.saveGames();

    analytics.event(new Event('JoinRoom'));
  }

  async saveName() {
    const { myName } = this.state;
    firebase
      .database()
      .ref(`users/${myName}`)
      .once('value', snap => {
        if (typeof snap.val() === 'undefined' || snap.val() === null) {
          firebase
            .database()
            .ref(`users/${myName}`)
            .set({
              name: myName,
              points: 0,
            });
        }
      });

    if (myName.length > 0) {
      // Save name to AsyncStorage
      try {
        await AsyncStorage.setItem('@MySuperStore:name', myName);
      } catch (error) {
        // Error saving data
        console.log(error);
      }
    }
  }

  componentWillReceiveProps() {
    // this.deleteGame(delete);
    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
  }

  // Delete a game from the 'My rooms' list
  deleteGame(name) {
    const { games } = this.state;
    games.splice(games.indexOf(name), 1);
    this.setState({
      games,
    });
    this.saveGames();
  }

  render() {
    const {
      isFirstOpen,
      fontsLoaded,
      newGameModalVisible,
      joinGameModalVisible,
      myName,
      myNameWB,
      newGameName,
      pw,
      pwAgain,
      newGameID,
      joinGameName,
      games,
      isNewGameIDCorrect,
      joingameId,
      joinMaster,
      joinPw,
      infoModalVisible,
    } = this.state;
    const { navigation } = this.props;
    if (isFirstOpen) {
      return (
        <ScrollView
          style={{ flex: 1 }}
          pagingEnabled
          horizontal
          vertical={false}
        >
          <StatusBar barStyle="dark-content" />
          <View style={styles.onboardContainter}>
            <Image
              source={Images.icon}
              style={{ width: 125, height: 125, marginBottom: 20 }}
            />
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{ fontSize: 30, textAlign: 'center' }}
            >
              Welcome to the Bullshit Bingo!
            </Text>
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{ fontSize: 20, textAlign: 'center', marginTop: 5 }}
            >
              We'll guide you trough the overcomplicated system of this game, or
              you can try to understand it on your own.
            </Text>
            <Text
              isLoaded={fontsLoaded}
              isBold={false}
              style={{ fontSize: 30, textAlign: 'center', marginTop: 20 }}
            >
              Swipe to continue >
            </Text>
          </View>
          <View style={styles.onboardContainter}>
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{ fontSize: 30, textAlign: 'center' }}
            >
              Rooms
            </Text>
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{ fontSize: 20, textAlign: 'center' }}
            >
              Inside rooms, you can find matches and other players. They are
              generally built around themes, like a Netflix show, a school
              class, or your workplace friend circle.
            </Text>
          </View>
          <View style={[styles.onboardContainter, { padding: 0 }]}>
            <View
              style={[
                styles.onboardContainter,
                { marginTop: 'auto', marginBottom: 'auto' },
              ]}
            >
              <Text
                isLoaded={fontsLoaded}
                isBold
                style={{ fontSize: 30, textAlign: 'center' }}
              >
                Matches
              </Text>
              <Text
                isLoaded={fontsLoaded}
                isBold
                style={{ fontSize: 20, textAlign: 'center' }}
              >
                One match tries to answer one question (e.g. "What's the next
                thing that's going to break in the office?"), with several
                possible answers (or cards) that you can vote on. If you vote on
                a card (eg. the window), and the window breaks, you get one
                point. You can only have votes on a maximum of 2 cards.
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
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{ fontSize: 30, textAlign: 'center' }}
            >
              Cards
            </Text>
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{ fontSize: 20, textAlign: 'center' }}
            >
              Cards are used to show you every information you may need: the
              text you can vote on (eg. the windows will broke), how much people
              voted on it, and the creator of it.
            </Text>
          </View>
          <View style={styles.onboardContainter}>
            <Image
              source={Images.firework}
              style={{ width: 125, height: 125, marginBottom: 20 }}
            />
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{ fontSize: 30, textAlign: 'center' }}
            >
              BINGO!
            </Text>
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{ fontSize: 20, textAlign: 'center' }}
            >
              If the event you voted on occurs (eg. the window breaks), the
              creator (master) of the match can give points for the players who
              voted on the corresponding card.
            </Text>
          </View>
          <View style={styles.onboardContainter}>
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{ fontSize: 30, textAlign: 'center' }}
            >
              Let's get started!
            </Text>
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{ fontSize: 20, textAlign: 'center' }}
            >
              Now you're all set. Have fun!
            </Text>
            <TouchableOpacity
              style={{ marginTop: 15 }}
              onPress={async () => {
                this.setState({ isFirstOpen: false });
                try {
                  await AsyncStorage.setItem('@MySuperStore:isFirst', 'false');
                } catch (error) {
                  // Error saving data
                  console.log(error);
                }
              }}
            >
              <ImageBackground
                source={Images.btn}
                style={{ width: 140, height: 58, justifyContent: 'center' }}
              >
                <Text isLoaded={fontsLoaded} isBold style={styles.join}>
                  Play
                </Text>
              </ImageBackground>
            </TouchableOpacity>
            <Image
              source={Images.add_child}
              style={{ width: 70, height: 59, marginTop: -2.5 }}
            />
          </View>
        </ScrollView>
      );
    }
    return (
      <View style={[styles.container, { backgroundColor: 'white' }]}>
        <StatusBar barStyle="dark-content" />
        <Modal
          animationType="slide"
          transparent={false}
          onRequestClose={() => this.setState({ newGameModalVisible: false })}
          visible={newGameModalVisible}
        >
          <ScrollView
            style={{ flex: 1, padding: 20, backgroundColor: 'white' }}
          >
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={[styles.heading, { fontSize: 36, marginLeft: 0 }]}
            >
              Create a new room
            </Text>
            <View
              style={{
                display: myName.length === 0 ? 'flex' : 'none',
              }}
            >
              <TextInput
                style={[
                  styles.input,
                  {
                    marginTop: 5,
                    marginBottom: 5,
                    fontFamily: fontsLoaded
                      ? 'cabin-sketch-bold'
                      : Platform.OS === 'ios'
                        ? 'Arial'
                        : 'Roboto',
                  },
                ]}
                underlineColorAndroid="transparent"
                placeholder="Your name"
                placeholderTextColor="#444"
                onChangeText={myNameWB => this.setState({ myNameWB })}
                value={myNameWB}
              />
              <Image source={Images.line_long} />
              <Text
                isLoaded={fontsLoaded}
                isBold
                style={{
                  fontSize: 16,
                  color: '#ee5253',
                  marginTop: 7.5,
                  display: myNameWB.length === 0 ? 'flex' : 'none',
                }}
              >
                Please don't leave any field empty.
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  marginTop: 20,
                  marginBottom: 5,
                  fontFamily: fontsLoaded
                    ? 'cabin-sketch-bold'
                    : Platform.OS === 'ios'
                      ? 'Arial'
                      : 'Roboto',
                },
              ]}
              underlineColorAndroid="transparent"
              placeholder="The name of the room"
              placeholderTextColor="#444"
              onChangeText={newGameName => this.setState({ newGameName })}
              value={newGameName}
            />
            <Image source={Images.line_long} />
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{
                color: '#ee5253',
                fontSize: 16,
                marginTop: 7.5,
                display: newGameName.length === 0 ? 'flex' : 'none',
              }}
            >
              Please don't leave any field empty.
            </Text>
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={[styles.p, { marginTop: 20 }]}
            >
              Password lock
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  marginTop: 5,
                  marginBottom: 5,
                  fontFamily: fontsLoaded
                    ? 'cabin-sketch-bold'
                    : Platform.OS === 'ios'
                      ? 'Arial'
                      : 'Roboto',
                },
              ]}
              underlineColorAndroid="transparent"
              secureTextEntry
              placeholder="Password"
              placeholderTextColor="#444"
              onChangeText={pw => this.setState({ pw })}
              value={pw}
            />
            <Image source={Images.line_long} />
            <TextInput
              style={[
                styles.input,
                {
                  marginTop: 5,
                  marginBottom: 5,
                  fontFamily: fontsLoaded
                    ? 'cabin-sketch-bold'
                    : Platform.OS === 'ios'
                      ? 'Arial'
                      : 'Roboto',
                },
              ]}
              underlineColorAndroid="transparent"
              secureTextEntry
              placeholder="Password again"
              placeholderTextColor="#444"
              onChangeText={pwAgain => this.setState({ pwAgain })}
              value={pwAgain}
            />
            <Image source={Images.line_long} />
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{
                color: '#ee5253',
                fontSize: 16,
                display: pw !== pwAgain ? 'flex' : 'none',
              }}
            >
              The passwords don't match.
            </Text>
            <View style={{ flexDirection: 'column' }}>
              <Text
                isLoaded={fontsLoaded}
                isBold
                style={[styles.p, { marginTop: 20 }]}
              >
                Room PIN:
              </Text>
              <Text isLoaded={fontsLoaded} isBold style={styles.h2}>
                {newGameID}
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
              <View style={{ flexDirection: 'column' }}>
                <Image
                  source={Images.create_child}
                  style={{ height: 102, width: 140, marginBottom: -2.5 }}
                />
                <TouchableOpacity
                  style={[styles.button, { marginRight: 25 }]}
                  disabled={
                    !!(
                      (myNameWB.length === 0 && myName.length === 0) ||
                      pw.length === 0 ||
                      pwAgain.length === 0 ||
                      newGameName.length === 0
                    )
                  }
                  onPress={async () => {
                    if (myNameWB.length > 0) {
                      await this.setState({
                        myName: myNameWB,
                        myNameWB: '',
                      });
                    }
                    this.createRoom();
                  }}
                >
                  <ImageBackground
                    source={Images.btn}
                    style={{
                      width: 140,
                      height: 58,
                      justifyContent: 'center',
                      opacity:
                        (myNameWB.length === 0 && myName.length === 0) ||
                        pw.length === 0 ||
                        pwAgain.length === 0 ||
                        newGameName.length === 0
                          ? 0.5
                          : 1,
                    }}
                  >
                    <Text isLoaded={fontsLoaded} isBold style={styles.join}>
                      Create
                    </Text>
                  </ImageBackground>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.button, { marginTop: 99.5 }]}
                onPress={() => {
                  this.setState({ newGameModalVisible: false });
                }}
              >
                <ImageBackground
                  source={Images.btn}
                  style={{ width: 140, height: 58, justifyContent: 'center' }}
                >
                  <Text isLoaded={fontsLoaded} isBold style={styles.join}>
                    Cancel
                  </Text>
                </ImageBackground>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Modal>
        <Modal
          animationType="slide"
          transparent={false}
          onRequestClose={() => this.setState({ joinGameModalVisible: false })}
          visible={joinGameModalVisible}
        >
          <ScrollView
            style={{ flex: 1, backgroundColor: 'white', padding: 20 }}
          >
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={[styles.heading, { fontSize: 40, marginBottom: 20 }]}
            >
              {`Join "${joinGameName}"?`}
            </Text>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'column' }}>
                <View
                  style={{
                    marginLeft: 20,
                    display: myName.length === 0 ? 'flex' : 'none',
                  }}
                >
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: '#666',
                        borderColor: '#666',
                        fontFamily: fontsLoaded
                          ? 'cabin-sketch-bold'
                          : Platform.OS === 'ios'
                            ? 'Arial'
                            : 'Roboto',
                      },
                    ]}
                    underlineColorAndroid="transparent"
                    placeholder="Your name"
                    placeholderTextColor="#444"
                    onChangeText={myNameWB => this.setState({ myNameWB })}
                    value={myNameWB}
                  />
                  <Image source={Images.line_long} />
                  <Text
                    isLoaded={fontsLoaded}
                    isBold
                    style={{
                      color: '#ee5253',
                      fontSize: 16,
                      marginTop: 7.5,
                      display: myNameWB.length === 0 ? 'flex' : 'none',
                    }}
                  >
                    Please don't leave any field empty.
                  </Text>
                </View>
                <View
                  style={{
                    marginLeft: 20,
                    display: myName === joinMaster ? 'flex' : 'none',
                  }}
                >
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: '#666',
                        borderColor: '#666',
                        fontFamily: fontsLoaded
                          ? 'cabin-sketch-bold'
                          : Platform.OS === 'ios'
                            ? 'Arial'
                            : 'Roboto',
                      },
                    ]}
                    secureTextEntry
                    placeholder="Room master password"
                    placeholderTextColor="#444"
                    underlineColorAndroid="transparent"
                    onChangeText={joinPw => this.setState({ joinPw })}
                    value={joinPw}
                  />
                  <Image source={Images.line_long} />
                  <Text
                    isLoaded={fontsLoaded}
                    isBold
                    style={{
                      color: '#ee5253',
                      fontSize: 16,
                      marginTop: 7.5,
                      display: joinPw.length === 0 ? 'flex' : 'none',
                    }}
                  >
                    Please don't leave any field empty.
                  </Text>
                </View>
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
                  <TouchableOpacity
                    style={[
                      styles.button,
                      { flex: 1, backgroundColor: 'transparent' },
                    ]}
                    onPress={async () => {
                      if (myNameWB.length > 0) {
                        await this.setState({
                          myName: myNameWB,
                          myNameWB: '',
                        });
                      }
                      this.joinRoom();
                    }}
                  >
                    <ImageBackground
                      source={Images.btn}
                      style={{
                        width: 140,
                        height: 58,
                        justifyContent: 'center',
                      }}
                    >
                      <Text isLoaded={fontsLoaded} isBold style={styles.join}>
                        Join
                      </Text>
                    </ImageBackground>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.button, { flex: 1, backgroundColor: 'white' }]}
                  onPress={() => {
                    this.setState({ joinGameModalVisible: false });
                  }}
                >
                  <ImageBackground
                    source={Images.btn}
                    style={{ width: 140, height: 58, justifyContent: 'center' }}
                  >
                    <Text isLoaded={fontsLoaded} isBold style={styles.join}>
                      Cancel
                    </Text>
                  </ImageBackground>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Modal>
        <Modal
          animationType="slide"
          transparent={false}
          onRequestClose={() => this.setState({ infoModalVisible: false })}
          visible={infoModalVisible}
        >
          <ScrollView style={{ flex: 1, padding: 25 }}>
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{ fontSize: 40, marginTop: 20 }}
            >
              Bullshit Bingo
            </Text>
            <Text
              isLoaded={fontsLoaded}
              isBold={false}
              style={{ fontSize: 20 }}
            >
              Imagine the endless possibilities of creating a bingo game about
              anything. Who's going to marry next, what's the next thing that's
              going to break in the office, etc.
              {'\n'}
              {'\n'}
              Well, that's what Bullshit Bingo is about.
              {'\n'}
              Create a room, share it with your friends, and play together
              freely.
            </Text>
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{ fontSize: 40, marginTop: 15 }}
            >
              Rules
            </Text>
            <Text
              isLoaded={fontsLoaded}
              isBold={false}
              style={{ fontSize: 20 }}
            >
              • You can only vote on 2 cards
              {'\n'}
              • Only the match's master (or creator) can delete cards and give
              points (via 'Bingo!' button)
              {'\n'}
              • The creators can kick anyone
              {'\n'}
              • Both the kicked players and the quitters can rejoin every room
              {'\n'}
              • Once the room master exits, the game is going to be deleted,
              permanently.
              {'\n'}
              • Have fun! ;)
            </Text>
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{ fontSize: 40, marginTop: 15 }}
            >
              Creator
            </Text>
            <Text isLoaded={fontsLoaded} isBold style={{ fontSize: 20 }}>
              This project is fully open-source.
            </Text>
            <Link
              text="Bullshit Bingo on GitHub"
              url="https://github.com/dandesz198/bullshitbingo"
            />
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{ fontSize: 20, marginTop: 10 }}
            >
              Daniel Gergely
            </Text>
            <Link text="GitHub" url="https://github.com/dandesz198" />
            <Link text="Facebook" url="https://fb.me/dandesz198" />
            <Link text="Twitter" url="https://twitter.com/dandesz198" />
            <Link text="LinkedIn" url="https://linkedin.com/in/dandesz198" />
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{ fontSize: 40, marginTop: 15 }}
            >
              Contributor
            </Text>
            <Text isLoaded={fontsLoaded} isBold style={{ fontSize: 20 }}>
              Péter Hajdu
            </Text>
            <Link text="GitHub" url="https://github.com/razor97" />
            <Link text="Facebook" url="https://fb.me/hajdupetke" />
            <Link text="Twitter" url="https://twitter.com/hajdupetke" />
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={{ fontSize: 40, marginTop: 15 }}
            >
              Legal notice
            </Text>
            <Text
              isLoaded={fontsLoaded}
              isBold={false}
              style={{ fontSize: 16 }}
            >
              Font family: Cabin Sketch               {'\n'}
              Drawn illustrations: Freepik
            </Text>
            <Link
              text="Link to the vectors"
              url="https://www.flaticon.com/free-icon/poo_720965"
            />
            <Text
              isLoaded={fontsLoaded}
              isBold={false}
              style={{ fontSize: 16 }}
            >
              Poop icon: Flaticon (by Freepik)
            </Text>
            <Link
              text="Link to the icon"
              url="https://www.freepik.com/free-vector/sketchy-children_797063.htm"
            />
            <TouchableOpacity
              style={{ marginLeft: 'auto', marginRight: 'auto', marginTop: 15 }}
              onPress={() => {
                Linking.openURL('https://paypal.me/dandesz198');
              }}
            >
              <Image
                source={Images.coffee}
                style={{ height: 45, width: 225 }}
              />
            </TouchableOpacity>
            <Text
              isLoaded={fontsLoaded}
              isBold
              style={[
                styles.p,
                { fontSize: 16, textAlign: 'center', marginTop: 5 },
              ]}
            >
              Since the server isn't free, every single cent of your donation is
              going to be spent on the costs of running this game.
            </Text>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  marginTop: 20,
                  marginBottom: 40,
                  width: 330,
                  height: 64,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                },
              ]}
              onPress={() => {
                this.setState({ infoModalVisible: false });
              }}
            >
              <ImageBackground
                source={Images.btn_wide}
                style={{
                  width: 330,
                  height: 64,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text isLoaded={fontsLoaded} isBold style={styles.join}>
                  Close
                </Text>
              </ImageBackground>
            </TouchableOpacity>
          </ScrollView>
        </Modal>
        <ScrollView style={{ flex: 1 }}>
          <View style={{ marginTop: 20, flexDirection: 'row' }}>
            <Text isLoaded={fontsLoaded} isBold style={styles.welcome}>
              Bullshit Bingo
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
              <Text isLoaded={fontsLoaded} isBold style={{ fontSize: 16 }}>
                0.13.8 [i]
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.button, { marginTop: 10 }]}
            onPress={() => {
              this.setState({ newGameModalVisible: true });
            }}
          >
            <ImageBackground
              source={Images.btn_wide}
              style={{
                width: 330,
                height: 64,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text isLoaded={fontsLoaded} isBold style={styles.join}>
                Create a new room
              </Text>
            </ImageBackground>
          </TouchableOpacity>
          <Text isLoaded={fontsLoaded} isBold style={styles.heading}>
            Join a room
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
                  style={[
                    styles.input,
                    {
                      flex: 1,
                      marginBottom: 2.5,
                      height: 40,
                      width: 180,
                      fontSize: 28,
                      textAlign: 'center',
                      fontFamily: fontsLoaded
                        ? 'cabin-sketch-bold'
                        : Platform.OS === 'ios'
                          ? 'Arial'
                          : 'Roboto',
                    },
                  ]}
                  placeholder="Room PIN"
                  placeholderTextColor="#444"
                  keyboardType="numeric"
                  underlineColorAndroid="transparent"
                  onChangeText={joingameId => this.setState({ joingameId })}
                  value={joingameId}
                />
                <Image source={Images.line_short} style={{ width: 140 }} />
              </View>
              <Text
                isLoaded={fontsLoaded}
                isBold
                style={{
                  color: '#ee5253',
                  fontSize: 16,
                  display: isNewGameIDCorrect ? 'none' : 'flex',
                }}
              >
                Please check the PIN.
              </Text>
              <TouchableOpacity
                style={[styles.button, { marginTop: 10, marginBottom: 'auto' }]}
                onPress={() => {
                  this.preJoin();
                }}
              >
                <ImageBackground
                  source={Images.btn}
                  style={{ width: 140, height: 58, justifyContent: 'center' }}
                >
                  <Text isLoaded={fontsLoaded} isBold style={styles.join}>
                    Join
                  </Text>
                </ImageBackground>
              </TouchableOpacity>
            </View>
          </View>
          <Text isLoaded={fontsLoaded} isBold style={styles.heading}>
            My rooms
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ListView
              dataSource={ds.cloneWithRows(games)}
              enableEmptySections
              renderRow={rowData => (
                <TouchableOpacity
                  style={{ padding: 2.5, marginLeft: 20 }}
                  onPress={() => {
                    navigation.navigate('Room', {
                      gameName: rowData.name,
                      gameId: rowData.id,
                      myName,
                      returnData: this.returnData.bind(this),
                    });
                    BackHandler.removeEventListener(
                      'hardwareBackPress',
                      this.onBackPress
                    );
                  }}
                >
                  <Text isLoaded={fontsLoaded} isBold style={styles.gameList}>
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
