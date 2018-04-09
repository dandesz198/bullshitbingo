import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Animated, ScrollView, ListView, Modal, Alert, AsyncStorage, Image, Dimensions, Linking, BackHandler, Vibration, ImageBackground, Platform, StatusBar } from 'react-native';
import { StackNavigator } from 'react-navigation';
import * as firebase from 'firebase';
import md5 from 'md5';
import { Analytics, PageHit, Event } from 'expo-analytics';
import Link from './Components/Link.js';
import FontText from './Components/FontText.js';
import { Updates, Font, ScreenOrientation } from 'expo';

let Environment = require('./environment.js')

let config = {
  apiKey: Environment.apiKey,
  authDomain: Environment.authDomain,
  databaseURL: Environment.databaseURL,
  projectId: Environment.projectId,
  storageBucket: Environment.storageBucket,
  messagingSenderId: Environment.messagingSenderId
};

let analytics = new Analytics(Environment.analytics);

let ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

console.disableYellowBox = true

export default class Home extends React.Component {
    state = {
      games: [],
      
      //Data for the new room
      newGameModalVisible: false,
      newGameName: '',
      newGameID: Math.floor(Math.random() * 899999 + 100000).toString(),
      pw: '',
      pwAgain: '',

      //Data for joining game
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

      fontsLoaded: false
  };

  returnData(id) {
    this.deleteGame(id);
  }

  componentWillMount() {
    //Initialize Firebase
    firebase.initializeApp(config);
    this.newId();
    this.loadGames();
  }

  async componentDidMount() {
    //Starts the first loop in color changing
    await Font.loadAsync({
      'cabin-sketch': require('./fonts/CabinSketch-Regular.ttf'),
      'cabin-sketch-bold': require('./fonts/CabinSketch-Bold.ttf')
    });

    this.setState({fontsLoaded: true});

    Expo.ScreenOrientation.allow(Expo.ScreenOrientation.Orientation.PORTRAIT);

    try {
      let value = await AsyncStorage.getItem('@MySuperStore:isFirst');
      if (value !== null){
        // We have data
        this.setState({isFirstOpen: false});
      } else {
        this.setState({isFirstOpen: true});
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
        this.setState({joinGameModalVisible: false, newGameModalVisible: false, infoModalVisible: false})
        Alert.alert('Update avaliable', "Please update the app in order to get the latest Bullshit Bingo experience. (It won't take more than 5 seconds, I swear)", [
          {text: 'OK', onPress: () => Expo.Updates.reload()},
          {text: 'GTFO', onPress: () => console.log('no update for you')},
        ]);
      }
    } catch (e) {
      // handle or log error
    }

    //Save the games with 2s delay
    setTimeout(() => {
      this.saveGames();
    }, 2000);
  }

  newId() {
    var thus = this;
    firebase.database().ref('games/' + this.state.newGameID).once('value', function(snap) {
      //Check if the game exists
      if(typeof snap.val() != "undefined" && snap.val() != null) {
        thus.setState({newGameID: Math.floor(Math.random() * 899999 + 100000).toString()});
        thus.newId();
      } else {
        return;
      }
    });
  }

  onBackPress () {
    this.setState({joinGameModalVisible: false, newGameModalVisible: false, infoModalVisible: false});
    return true;
  }

  //Save data to the AsyncStorage
  async saveGames() {
    //Save games to AsyncStorage
    try {
      await AsyncStorage.setItem('@MySuperStore:games', JSON.stringify(this.state.games));
    } catch (error) {
      // Error saving data
      console.log(error);
    }
  }

  //Load data from the AsyncStorage
  async loadGames() {
    //Get name from AsyncStorage
    try {
      let value = await AsyncStorage.getItem('@MySuperStore:name');
      if (value !== null){
        // We have data
        this.setState({myName: value});
      }
    } catch (error) {
      // Error retrieving data
      console.log(error);
    }

    setTimeout(async() => {
      //Get games from AsyncStorage
      try {
        let value = await AsyncStorage.getItem('@MySuperStore:games');
        if (value !== null){
          // We have data
          var array = JSON.parse(value);
          var thus = this;

          array.forEach(async(element) => {
            //Remove the " from the start and end of the string
            if(element.name[0] == '"') {
              element.name = element.name.slice(1, -1);
            }
            
            //Check if room still exists
            firebase.database().ref('games/'+element.id+'/members/')
            .once('value')
            .then((snap) => {
              if(snap.val()) {
                var members = Object.values(snap.val());
                var count = 0;

                members.forEach(lm => {
                  if(lm == thus.state.myName) {
                    count += 1;
                  }
                });
              }
              else {
                thus.deleteGame(element.name);
              }

              //If member even exists
              if(members) {
                //If room doesn't exist or player is kicked
                if(members.length < 0 || count <= 0) {
                  thus.deleteGame(element.name);
                } else {

                }
              } else {
                thus.deleteGame(element.name);
              }
            })
          });
          this.setState({games: array});
        }
      } catch (error) {
        // Error retrieving data
        console.log(error);
      }
    }, 500);
  }

  async createRoom() {
    if((this.state.myNameWB.length == 0 && this.state.myName.length == 0) || this.state.pw.length == 0 || this.state.pwAgain.length == 0 || this.state.newGameName.length == 0) {
      Vibration.vibrate();
      return;
    }

    this.saveName();

    //Check the password
    if(this.state.pw != this.state.pwAgain) {
      this.setState({newGameModalVisible: false});
      Vibration.vibrate();
      Alert.alert('Error', "The passowrds don't look the same for me.", [
        {text: 'OK', onPress: () => this.setState({newGameModalVisible: true})},
      ]);
      return;
    }
    
    //Upload the game itself to Firebase
    await firebase.database().ref('games/'+this.state.newGameID).set({
      name: this.state.newGameName,
      master: this.state.myName,
      masterPw: md5(this.state.pw),
      members: [this.state.myName]
    });

    //Add the new game to the Games array (rendered in 'My rooms' section)
    var games = this.state.games;
    var game = {id: this.state.newGameID, name: this.state.newGameName};

    games.push(game);

    this.setState({games: games, newGameModalVisible: false});
    
    //Navigate to the new game's screen
    this.props.navigation.navigate('Room', {gameName: this.state.newGameName, gameId: this.state.newGameID, myName: this.state.myName, returnData: this.returnData.bind(this)});
    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);

    //Save the new game to AsyncStorage
    this.saveGames();

    //Create new game ID for the next game, empty the screen
    this.setState({pw: '', pwAgain: '', newGameName: '', newGameID: Math.floor(Math.random() * 899999 + 100000).toString()});

    analytics.event(new Event('Createroom'));
  }

  preJoin() {
    var thus = this;

    if(this.state.joingameId.length < 6) {
      //Alert.alert("Error", "Something bad happened (maybe). Please check the game PIN and/or try again later.");
      this.setState({isNewGameIDCorrect: false});
      Vibration.vibrate();
      return;
    }

    //Get the name and the master's name of the new room
    firebase.database().ref('games/' + this.state.joingameId).once('value', function(snap) {
      if(snap.val() != null && snap.val() && typeof snap.val() != 'undefined') {
        var newGameName = JSON.stringify(snap.val().name);
      }
      else {
        //Alert.alert("Error", "Something bad happened (maybe). Please check the game PIN and/or try again later.");
        thus.setState({isNewGameIDCorrect: false});
        Vibration.vibrate();
        return;
      }

      //Check if the game exists
      if(newGameName.length > 1 && newGameName != "null") {
        var masterName = JSON.stringify(snap.val().master);
        var masterPw = JSON.stringify(snap.val().masterPw);

        //Remove "
        newGameName = newGameName.slice(1, -1);
        masterName = masterName.slice(1, -1);
        masterPw = masterPw.slice(1, -1);

        //Open the connection modal
        thus.setState({joinGameName: newGameName, joinMaster: masterName, roomPw: masterPw, joinGameModalVisible: true});
      } else {
        Alert.alert("Error", "Something bad happened (maybe). Please check the game PIN and/or try again later.");
        Vibration.vibrate();
      }
    });
  }

  async joinRoom() {
    if(this.state.myName.length == 0) {
      this.setState({joinGameModalVisible: false});
      Vibration.vibrate();
      Alert.alert('Error', 'I saw terrible things... Empty fields. Please fill in the form to continue.', [
        {text: 'OK', onPress: () => this.setState({joinGameModalVisible: true})},
      ]);
      return;
    }

    this.saveName();

    //Check the password
    if(this.state.myName == this.state.joinMaster && this.state.roomPw != md5(this.state.joinPw)) {
      Vibration.vibrate();
      Alert.alert('Error', 'The password is incorrect.');
      return;
    }

    var thus = this;

    //Add the user to Firebase
    await firebase.database().ref('games/'+this.state.joingameId+'/members/').once('value', (snap) => {
      var members = Object.values(snap.val());
      if(members.indexOf(thus.state.myName) == -1) {
        firebase.database().ref('games/'+thus.state.joingameId+'/members/').push(thus.state.myName);
      }
    })

    //Add the new game to the games array (rendered in the 'My rooms' section in Home.js)
    var games = this.state.games;
    var game = {id: this.state.joingameId, name: this.state.joinGameName};
    var alreadyAdded = false;

    games.forEach(element => {
      if(element.id == this.state.joingameId) {
        alreadyAdded = true;
      }
    });

    if(!alreadyAdded) {
      games.push(game);
    }

    this.setState({joinGameModalVisible: false, games: games});

    //Navigate to the game
    this.props.navigation.navigate('Room', {gameName: this.state.joinGameName, gameId: this.state.joingameId, myName: this.state.myName, returnData: this.returnData.bind(this)});

    this.setState({joingameId: '', joinPw: '', roomPw: ''});

    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);

    //Save to AsyncStorage
    this.saveGames();

    analytics.event(new Event('JoinRoom'));
  }

  async saveName() {
    firebase.database().ref('users/'+this.state.myName).once('value', (snap) => {
      if(typeof snap.val() == "undefined" || snap.val() == null) {
        firebase.database().ref('users/'+this.state.myName).set({
          name: this.state.myName,
          points: 0
        });
      } else {
        return;
      }
    });

    if(this.state.myName.length > 0) {
      //Save name to AsyncStorage
      try {
        await AsyncStorage.setItem('@MySuperStore:name', this.state.myName);
      } catch (error) {
        // Error saving data
        console.log(error);
      }
    }
  }

  componentWillReceiveProps() {
    this.deleteGame(this.props.delete);
    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
  }

  //Delete a game from the 'My rooms' list
  deleteGame(name) {
    var games = this.state.games;
    games.splice(games.indexOf(name), 1);
    this.setState({games: games});
    this.saveGames();
  }

  render() {
    if(this.state.isFirstOpen) {
      return (
        <ScrollView style={{flex: 1}} pagingEnabled={true} horizontal={true} vertical={false}>
          <StatusBar
            barStyle={'dark-content'}/>
          <View style={styles.onboardContainter}>
            <Image source={require('./images/icon.png')} style={{width: 125, height: 125, marginBottom: 20}} />
            <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 30, textAlign: 'center'}}>Welcome to the {'\n'} Bullshit Bingo!</FontText>
            <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 20, textAlign: 'center', marginTop: 5}}>We'll guide you trough the overcomplicated system of this game, or you can try to understand it on your own.</FontText>
          </View>
          <View style={styles.onboardContainter}>
            <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 30, textAlign: 'center'}}>Rooms</FontText>
            <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 20, textAlign: 'center'}}>Inside rooms, you can find matches and other players. They are generally built around themes, like a Netflix show, a school class, or your workplace friend circle.</FontText>
          </View>
          <View style={[styles.onboardContainter, {padding: 0}]}>
            <View style={[styles.onboardContainter, {marginTop: 'auto', marginBottom: 'auto'}]}>
              <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 30, textAlign: 'center'}}>Matches</FontText>
              <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 20, textAlign: 'center'}}>One match tries to answer one question (e.g. "What's the next thing that's going to break in the office?"), with several possible answers (or cards) that you can vote on. If you vote on a card (eg. the window), and the window breaks, you get one point. You can only have votes on a maximum of 2 cards.</FontText>
            </View>
            <Image source={require('./images/create_child.png')} style={{width: 120, height: 87, marginTop: 'auto', marginBottom: 0}}/>
          </View>
          <View style={styles.onboardContainter}>
            <Image source={require('./images/tutorial_card.png')} style={{width: 300, height: 125, marginBottom: 20}} />
            <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 30, textAlign: 'center'}}>Cards</FontText>
            <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 20, textAlign: 'center'}}>Cards are used to show you every information you may need: the text you can vote on (eg. the windows will broke), how much people voted on it, and the creator of it.</FontText>
          </View>
          <View style={styles.onboardContainter}>
            <Image source={require('./images/firework.png')} style={{width: 125, height: 125, marginBottom: 20}} />
            <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 30, textAlign: 'center'}}>BINGO!</FontText>
            <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 20, textAlign: 'center'}}>If the event you voted on occurs (eg. the window breaks), the creator (master) of the match can give points for the players who voted on the corresponding card.</FontText>
          </View>
          <View style={styles.onboardContainter}>
            <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 30, textAlign: 'center'}}>Let's get started!</FontText>
            <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 20, textAlign: 'center'}}>Now you're all set. Have fun!</FontText>
            <TouchableOpacity style={{marginTop: 15}} onPress={async()=>{
              this.setState({isFirstOpen: false});
              try {
                await AsyncStorage.setItem('@MySuperStore:isFirst', 'false');
              } catch (error) {
                // Error saving data
                console.log(error);
              }
              }}>
              <ImageBackground source={require('./images/btn.png')} style={{width: 140, height: 58, justifyContent: 'center'}}>
                <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={styles.join}>Play</FontText>
              </ImageBackground>
            </TouchableOpacity>
            <Image source={require('./images/add_child.png')} style={{width: 70, height: 59, marginTop: -2.5}}/>
          </View>
        </ScrollView>
      )
    } else {
      return (
        <View style={[styles.container, {backgroundColor: 'white'}]}>
          <StatusBar
            barStyle={'dark-content'}/>
          <Modal
            animationType="slide"
            transparent={false}
            onRequestClose={()=>this.setState({newGameModalVisible: false})}
            visible={this.state.newGameModalVisible}>
            <ScrollView style={{flex: 1, padding: 20, backgroundColor: 'white'}}>
              <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={[styles.heading, {fontSize: 36, marginLeft: 0}]}>Create a new room</FontText>
              <View style={{display: this.state.myName.length == 0 ? 'flex' : 'none'}}>
                <TextInput
                  style={[styles.input, {marginTop: 5, marginBottom: 5, fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : Platform.OS == "ios" ? "Arial" : "Roboto"}]}
                  underlineColorAndroid='transparent'
                  placeholder="Your name"
                  placeholderTextColor="#444"
                  onChangeText={(myNameWB) => this.setState({myNameWB})}
                  value={this.state.myNameWB}
                />
                <Image source={require('./images/line_long.png')} />
                <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 16, color: '#ee5253', marginTop: 7.5, display: this.state.myNameWB.length == 0 ? 'flex' : 'none'}}>Please don't leave any field empty.</FontText>
              </View>
              <TextInput
                style={[styles.input, {marginTop: 20, marginBottom: 5, fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : Platform.OS == "ios" ? "Arial" : "Roboto"}]}
                underlineColorAndroid='transparent'
                placeholder="The name of the room"
                placeholderTextColor="#444"
                onChangeText={(newGameName) => this.setState({newGameName})}
                value={this.state.newGameName}
              />
              <Image source={require('./images/line_long.png')} />
              <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{color: '#ee5253', fontSize: 16, marginTop: 7.5, display: this.state.newGameName.length == 0 ? 'flex' : 'none'}}>Please don't leave any field empty.</FontText>
              <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={[styles.p, {marginTop: 20}]}>Password lock</FontText>
              <TextInput
                style={[styles.input, {marginTop: 5, marginBottom: 5, fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : Platform.OS == "ios" ? "Arial" : "Roboto"}]}
                underlineColorAndroid='transparent'
                secureTextEntry={true}
                placeholder="Password"
                placeholderTextColor="#444"
                onChangeText={(pw) => this.setState({pw})}
                value={this.state.pw}
              />
              <Image source={require('./images/line_long.png')} />
              <TextInput
                style={[styles.input, {marginTop: 5, marginBottom: 5, fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : Platform.OS == "ios" ? "Arial" : "Roboto"}]}
                underlineColorAndroid='transparent'
                secureTextEntry={true}
                placeholder="Password again"
                placeholderTextColor="#444"
                onChangeText={(pwAgain) => this.setState({pwAgain})}
                value={this.state.pwAgain}
              />
              <Image source={require('./images/line_long.png')} />
              <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{color: '#ee5253', fontSize: 16, display: this.state.pw !== this.state.pwAgain ? 'flex' : 'none'}}>The passwords don't match.</FontText>
              <View style={{flexDirection: 'column'}}>
                <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={[styles.p, {marginTop: 20}]}>Room PIN:</FontText>
                <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={styles.h2}>{this.state.newGameID}</FontText>
              </View>
              <View style={{flexDirection: 'row', alignContent: 'center', justifyContent: 'center', marginVertical: 30}}>
                <View style={{flexDirection: 'column'}}>
                  <Image source={require('./images/create_child.png')} style={{height: 102, width: 140, marginBottom: -2.5}}/>
                  <TouchableOpacity style={[styles.button, {marginRight: 25}]} disabled={(this.state.myNameWB.length == 0 && this.state.myName.length == 0) || this.state.pw.length == 0 || this.state.pwAgain.length == 0 || this.state.newGameName.length == 0 ? true : false} onPress={
                    async() => {
                      if(this.state.myNameWB.length > 0) {
                        await this.setState({myName: this.state.myNameWB, myNameWB: ''});
                      }
                      this.createRoom();
                    }
                  }>
                    <ImageBackground source={require('./images/btn.png')} style={{width: 140, height: 58, justifyContent: 'center', opacity: (this.state.myNameWB.length == 0 && this.state.myName.length == 0) || this.state.pw.length == 0 || this.state.pwAgain.length == 0 || this.state.newGameName.length == 0 ? 0.5 : 1}}>
                      <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={styles.join}>Create</FontText>
                    </ImageBackground>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={[styles.button, {marginTop: 99.5}]} onPress={()=>{this.setState({newGameModalVisible: false})}}>
                  <ImageBackground source={require('./images/btn.png')} style={{width: 140, height: 58, justifyContent: 'center'}}>
                    <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={styles.join}>Cancel</FontText>
                  </ImageBackground>
                </TouchableOpacity>
              </View>
            </ScrollView> 
          </Modal>
          <Modal
            animationType="slide"
            transparent={false}
            onRequestClose={()=>this.setState({joinGameModalVisible: false})}
            visible={this.state.joinGameModalVisible}>
            <ScrollView style={{flex: 1, backgroundColor: 'white', padding: 20}}>
              <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={[styles.heading, {fontSize: 40, marginBottom: 20}]}>Join "{this.state.joinGameName}"?</FontText>
              <View style={{flex: 1}}>
                <View style={{flexDirection: 'column'}}>
                  <View style={{marginLeft: 20, display: this.state.myName.length == 0 ? 'flex' : 'none'}}>
                    <TextInput
                      style={[styles.input, {color: '#666', borderColor: '#666', fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : Platform.OS == "ios" ? "Arial" : "Roboto"}]}
                      underlineColorAndroid='transparent'
                      placeholder="Your name"
                      placeholderTextColor="#444"
                      onChangeText={(myName) => this.setState({myName})}
                      value={this.state.myName}
                    />
                    <Image source={require('./images/line_long.png')} />
                    <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{color: '#ee5253', fontSize: 16, marginTop: 7.5, display: this.state.myNameWB.length == 0 ? 'flex' : 'none'}}>Please don't leave any field empty.</FontText>
                  </View>
                  <View style={{marginLeft: 20, display: this.state.myName == this.state.joinMaster ? 'flex' : 'none'}}>
                    <TextInput
                      style={[styles.input, {color: '#666', borderColor: '#666', fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : Platform.OS == "ios" ? "Arial" : "Roboto"}]}
                      secureTextEntry={true}
                      placeholder="Room master password"
                      placeholderTextColor="#444"
                      underlineColorAndroid='transparent'
                      onChangeText={(joinPw) => this.setState({joinPw})}
                      value={this.state.joinPw}
                    />
                    <Image source={require('./images/line_long.png')} />
                    <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{color: '#ee5253', fontSize: 16, marginTop: 7.5, display: this.state.joinPw.length == 0 ? 'flex' : 'none'}}>Please don't leave any field empty.</FontText>
                  </View>
                </View>
                <Image source={require('./images/join_bg.png')} style={{height: Dimensions.get('window').height * (35 / 100), width: Dimensions.get('window').height * (35 / 100), marginVertical: 20, alignSelf: 'center'}} />
                <View style={[styles.card, {flexDirection: 'row', alignItems: 'center', alignSelf: 'center'}]}>
                  <View style={[styles.button, {flex: 1, marginRight: 25}]}>
                    <TouchableOpacity style={[styles.button, {flex: 1, backgroundColor: 'transparent'}]} onPress={
                      async() => {
                        if(this.state.myNameWB.length > 0) {
                          await this.setState({myName: this.state.myNameWB, myNameWB: ''});
                        }
                        this.joinRoom();
                      }
                    }>
                      <ImageBackground source={require('./images/btn.png')} style={{width: 140, height: 58, justifyContent: 'center'}}>
                        <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={styles.join}>Join</FontText>
                      </ImageBackground>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={[styles.button, {flex: 1, backgroundColor: 'white'}]} onPress={()=>{this.setState({joinGameModalVisible: false})}}>
                    <ImageBackground source={require('./images/btn.png')} style={{width: 140, height: 58, justifyContent: 'center'}}>
                      <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={styles.join}>Cancel</FontText>
                    </ImageBackground>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Modal>
          <Modal
            animationType="slide"
            transparent={false}
            onRequestClose={()=>this.setState({infoModalVisible: false})}
            visible={this.state.infoModalVisible}>
            <ScrollView style={{flex: 1, padding: 25}}>
              <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 40, marginTop: 20}}>Bullshit Bingo</FontText>
              <FontText isLoaded={this.state.fontsLoaded} isBold={false} style={{fontSize: 20}}>
                Imagine the endless possibilities of creating a bingo game about anything. Who's going to marry next, what's the next thing that's going to break in the office, etc.{"\n"}{"\n"}
                Well, that's what Bullshit Bingo is about.{"\n"}
                Create a room, share it with your friends, and play together freely.
              </FontText>
              <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 40, marginTop: 15}}>Rules</FontText>
              <FontText isLoaded={this.state.fontsLoaded} isBold={false} style={{fontSize: 20}}>
                • You can only vote on 2 cards{"\n"}
                • Only the match's master (or creator) can delete cards and give points (via 'Bingo!' button){"\n"}
                • The creators can kick anyone{"\n"}
                • Both the kicked players and the quitters can rejoin every room{"\n"}
                • Once the room master exits, the game is going to be deleted, permanently.{"\n"}
                • Have fun! ;)
              </FontText>
              <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 40, marginTop: 15}}>Creator</FontText>
              <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 20}}>This project is fully open-source.</FontText>
              <Link text="Bullshit Bingo on GitHub" url="https://github.com/dandesz198/bullshitbingo" />
              <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 20, marginTop: 10}}>
                Daniel Gergely
              </FontText>
              <Link text="GitHub" url="https://github.com/dandesz198" />
              <Link text="Facebook" url="https://fb.me/dandesz198" />
              <Link text="Twitter" url="https://twitter.com/dandesz198" />
              <Link text="LinkedIn" url="https://linkedin.com/in/dandesz198" />
              <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 40, marginTop: 15}}>Contributor</FontText>
              <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 20}}>
                Péter Hajdu
              </FontText>
              <Link text="GitHub" url="https://github.com/razor97" />
              <Link text="Facebook" url="https://fb.me/hajdupetke" />
              <Link text="Twitter" url="https://twitter.com/hajdupetke" />
              <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 40, marginTop: 15}}>Legal notice</FontText>
              <FontText isLoaded={this.state.fontsLoaded} isBold={false} style={{fontSize: 16}}>
              Font family: Cabin Sketch {"\n"}
              Drawn illustrations: Freepik
              </FontText>
              <Link text="Link to the vectors" url="https://www.flaticon.com/free-icon/poo_720965" />
              <FontText isLoaded={this.state.fontsLoaded} isBold={false} style={{fontSize: 16}}>
                Poop icon: Flaticon (by Freepik)
              </FontText>
              <Link text="Link to the icon" url="https://www.freepik.com/free-vector/sketchy-children_797063.htm" />
              <TouchableOpacity style={{marginLeft: 'auto', marginRight: 'auto', marginTop: 15}} onPress={()=>{Linking.openURL('https://paypal.me/dandesz198')}}>
                <Image source={require('./images/coffee.png')} style={{height: 45, width: 225}}/>
              </TouchableOpacity>
              <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={[styles.p, {fontSize: 16, textAlign: 'center', marginTop: 5}]}>Since the server isn't free, every single cent of your donation is going to be spent on the costs of running this game.</FontText>
              <TouchableOpacity style={[styles.button, {marginTop: 20, marginBottom: 40, width: 330, height: 64, marginLeft: 'auto', marginRight: 'auto'}]} onPress={()=>{this.setState({infoModalVisible: false})}}>
                <ImageBackground source={require('./images/btn_wide.png')} style={{width: 330, height: 64, alignItems: 'center', justifyContent: 'center'}}>
                  <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={styles.join}>Close</FontText>
                </ImageBackground>
              </TouchableOpacity>
            </ScrollView>
          </Modal>
          <ScrollView style={{flex: 1}}>
            <View style={{marginTop: 20, flexDirection: 'row'}}>
              <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={styles.welcome}>Bullshit Bingo</FontText>
              <TouchableOpacity style={{marginTop: 'auto', marginBottom: 5, marginLeft: 'auto', marginRight: 20}} onPress={() => {this.setState({infoModalVisible: true})}}>
                <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{fontSize: 16}}>0.13.3 [i]</FontText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.button, {marginTop: 10}]} onPress={()=>{this.setState({newGameModalVisible: true})}}>
              <ImageBackground source={require('./images/btn_wide.png')} style={{width: 330, height: 64, alignItems: 'center', justifyContent: 'center'}}>
                <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={styles.join}>Create a new room</FontText>
              </ImageBackground>
            </TouchableOpacity>
            <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={styles.heading}>Join a room</FontText>
            <View style={{flexDirection: 'row', justifyContent: 'center'}}>
              <Image source={require('./images/home_child.png')} style={{height: 180, width: 105, marginTop: 10, marginLeft: 0, marginRight: 'auto'}} />
              <View style={{flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', marginBottom: 'auto', marginRight: 'auto', marginLeft: 'auto'}}>
                <View style={{height: 60, alignItems: 'center', justifyContent: 'center'}}>
                  <TextInput
                    style={[styles.input, {flex: 1, marginBottom: 2.5, height: 40, width: 180, fontSize: 28, textAlign: 'center', fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : Platform.OS == "ios" ? "Arial" : "Roboto"}]}
                    placeholder="Room PIN"
                    placeholderTextColor="#444"
                    keyboardType="numeric"
                    underlineColorAndroid='transparent'
                    onChangeText={(joingameId) => this.setState({joingameId})}
                    value={this.state.joingameId}
                  />
                  <Image source={require('./images/line_short.png')} style={{width: 140}} />
                </View>
                <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={{color: '#ee5253', fontSize: 16, display: this.state.isNewGameIDCorrect ? 'none' : 'flex'}}>Please check the PIN.</FontText>
                <TouchableOpacity style={[styles.button, {marginTop: 10, marginBottom: 'auto'}]}
                onPress={()=>{this.preJoin()}}
                  >
                  <ImageBackground source={require('./images/btn.png')} style={{width: 140, height: 58, justifyContent: 'center'}}>
                    <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={styles.join}>Join</FontText>
                  </ImageBackground>
                </TouchableOpacity>
              </View>
            </View>
            <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={styles.heading}>My rooms</FontText>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <ListView
                dataSource={ds.cloneWithRows(this.state.games)}
                enableEmptySections={true}
                renderRow={(rowData) => 
                  <TouchableOpacity style={{padding: 2.5, marginLeft: 20}} onPress={()=>{
                    this.props.navigation.navigate('Room', {gameName: rowData.name, gameId: rowData.id, myName: this.state.myName, returnData: this.returnData.bind(this)});
                    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
                  }}>
                    <FontText isLoaded={this.state.fontsLoaded} isBold={true} style={styles.gameList}>{rowData.name}</FontText>
                    <Image source={require('./images/line_short.png')} />
                  </TouchableOpacity>
                }
              />
              <Image source={require('./images/home_grass.png')} style={{width: 45, height: 45, marginRight: 30}}/>
            </View>
          </ScrollView>
        </View>
      );
    }
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center'
  },

  welcome: {
    fontSize: 40,
    marginLeft: 20,
    marginTop: 20
  },

  heading: {
    fontSize: 30,
    marginTop: 30,
    marginLeft: 20
  },

  input: {
    padding: 5,
    fontSize: 20
  },

  button: {
    justifyContent: 'center',
    alignItems: 'center'
  },

  join: {
    fontSize: 30,
    textAlign: 'center'
  },

  gameList: {
    fontSize: 30,
    marginVertical: 5
  },

  h2: {
    fontSize: 34
  },

  p: {
    fontSize: 24
  },

  onboardContainter: {
    width: Dimensions.get('window').width, 
    height: Dimensions.get('window').height, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 30,
    backgroundColor: 'white'
  },

  card: {
    width: Dimensions.get('window').width * 0.9,
    marginHorizontal: Dimensions.get('window').width * 0.05,
    marginVertical: 10,
    padding: 15
  }
});