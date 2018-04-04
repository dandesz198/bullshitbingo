import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Animated, ScrollView, ListView, Modal, Alert, AsyncStorage, Image, Dimensions, Linking, BackHandler, Vibration, ImageBackground } from 'react-native';
import { StackNavigator } from 'react-navigation';
import * as firebase from 'firebase';
import md5 from 'md5';
import { Analytics, PageHit, Event } from 'expo-analytics';
import Link from './Components/Link.js';
import { Updates, Font } from 'expo';

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

  async newId() {
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
                  if(lm == this.state.myName) {
                    count += 1;
                  }
                });
              }
              else {
                this.deleteGame(element.name);
              }

              //If member even exists
              if(members) {
                //If room doesn't exist or player is kicked
                if(members.length < 0 || count <= 0) {
                  this.deleteGame(element.name);
                } else {

                }
              } else {
                this.deleteGame(element.name);
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
          <View style={[styles.onboardContainter, {backgroundColor: '#2f3542'}]}>
            <Image source={require('./poo.png')} style={{width: 125, height: 125}} />
            <Text style={{fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginTop: 10}}>Welcome to the {'\n'} Bullshit Bingo!</Text>
            <Text style={{fontSize: 20, textAlign: 'center', marginTop: 5}}>We'll guide you trough the overcomplicated system of this game, or you can try to understand it on your own.</Text>
          </View>
          <View style={[styles.onboardContainter, {backgroundColor: '#5352ed'}]}>
            <Text style={{fontSize: 30, fontWeight: 'bold', textAlign: 'center'}}>Rooms</Text>
            <Text style={{fontSize: 20, textAlign: 'center'}}>Inside rooms, you can find matches and other players. They are generally built around themes, like a Netflix show, a school class, or your workplace friend circle.</Text>
          </View>
          <View style={[styles.onboardContainter, {backgroundColor: '#3742fa'}]}>
            <Text style={{fontSize: 30, fontWeight: 'bold', textAlign: 'center'}}>Matches</Text>
            <Text style={{fontSize: 20, textAlign: 'center'}}>They got a question (e.g. "What's the next thing that's going to break in the office?"), and several cards (or answers) that you can vote on. If you vote on a card, and that thing breaks, you win. You can only have votes on a maximum of 2 cards.</Text>
          </View>
          <View style={[styles.onboardContainter, {backgroundColor: '#1e90ff'}]}>
            <Text style={{fontSize: 30, fontWeight: 'bold', textAlign: 'center'}}>Cards</Text>
            <Text style={{fontSize: 20, textAlign: 'center'}}>Cards are used to show you every information you may need ever: the text you can vote on, how much people voted on it, and that who created it. If you can't vote on a card, that can mean two things: 1., you exceeded your 2-card limit on the votes and/or the card already had a BINGO! on it. (Only the match master (the creator of the match) can give points for the players)</Text>
          </View>
          <View style={[styles.onboardContainter, {backgroundColor: '#2ed573'}]}>
            <Text style={{fontSize: 30, fontWeight: 'bold', textAlign: 'center'}}>BINGO!</Text>
            <Text style={{fontSize: 20, textAlign: 'center'}}>If the text you voted on occurs (eg. the room #42's windows broke), the match master can give points for the players who voted on the corresponding card.</Text>
          </View>
          <View style={[styles.onboardContainter, {backgroundColor: '#ff4757'}]}>
            <Text style={{fontSize: 30, fontWeight: 'bold', textAlign: 'center'}}>Let's get started!</Text>
            <Text style={{fontSize: 20, textAlign: 'center'}}>Now you're all set. Have fun!</Text>
            <TouchableOpacity style={{marginTop: 15}} onPress={()=>{this.setState({isFirstOpen: false})}}>
              <Text style={{fontSize: 30, textAlign: 'center'}}>Play</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )
    } else {
      return (
        <View style={[styles.container, {backgroundColor: 'white'}]}>
          <Modal
            animationType="slide"
            transparent={false}
            onRequestClose={()=>this.setState({newGameModalVisible: false})}
            visible={this.state.newGameModalVisible}>
            <View style={{flex: 1, backgroundColor: 'white', padding: 20}}>
              <ScrollView style={{flex: 1}}>
                <Text style={[styles.heading, {fontSize: 36, marginLeft: 0, fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}>Create a new room</Text>
                <View style={{display: this.state.myName.length == 0 ? 'flex' : 'none'}}>
                  <TextInput
                    style={[styles.input, {fontFamily: this.state.fontsLoaded ? 'cabin-sketch' : 'Arial', marginTop: 5, marginBottom: 5}]}
                    underlineColorAndroid='transparent'
                    placeholder="Your name (public)"
                    placeholderTextColor="#222"
                    onChangeText={(myNameWB) => this.setState({myNameWB})}
                    value={this.state.myNameWB}
                  />
                  <Image source={require('./images/line_long.png')} />
                  <Text style={{fontSize: 16, marginTop: 10, display: this.state.myName.length == 0 && this.state.myNameWB.length == 0 ? 'flex' : 'none', fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}}>Please don't leave any field empty.</Text>
                </View>
                <TextInput
                  style={[styles.input, {fontFamily: this.state.fontsLoaded ? 'cabin-sketch' : 'Arial', marginTop: 20, marginBottom: 5}]}
                  underlineColorAndroid='transparent'
                  placeholder="The name of the room (public)"
                  placeholderTextColor="#222"
                  onChangeText={(newGameName) => this.setState({newGameName})}
                  value={this.state.newGameName}
                />
                <Image source={require('./images/line_long.png')} />
                <Text style={{color: '#ee5253', fontSize: 16, marginTop: 10, display: this.state.newGameName.length == 0 ? 'flex' : 'none', fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}}>Please don't leave any field empty.</Text>
                <Text style={[styles.p, {marginTop: 20, fontWeight: 'bold', fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}>Password lock (for you only)</Text>
                <TextInput
                  style={[styles.input, {fontFamily: this.state.fontsLoaded ? 'cabin-sketch' : 'Arial', marginTop: 5, marginBottom: 5}]}
                  underlineColorAndroid='transparent'
                  secureTextEntry={true}
                  placeholder="Password"
                  placeholderTextColor="#222"
                  onChangeText={(pw) => this.setState({pw})}
                  value={this.state.pw}
                />
                <Image source={require('./images/line_long.png')} />
                <TextInput
                  style={[styles.input, {fontFamily: this.state.fontsLoaded ? 'cabin-sketch' : 'Arial', marginTop: 5, marginBottom: 5}]}
                  underlineColorAndroid='transparent'
                  secureTextEntry={true}
                  placeholder="Password again"
                  placeholderTextColor="#222"
                  onChangeText={(pwAgain) => this.setState({pwAgain})}
                  value={this.state.pwAgain}
                />
                <Image source={require('./images/line_long.png')} />
                <Text style={{color: '#ee5253', fontSize: 16, display: this.state.pw !== this.state.pwAgain ? 'flex' : 'none', fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}}>The passwords don't match.</Text>
                <View style={{flexDirection: 'column'}}>
                  <Text style={[styles.p, {marginTop: 20, fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}>Room PIN:</Text>
                  <Text style={[styles.h2, {fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}>{this.state.newGameID}</Text>
                </View>
                <View style={{flexDirection: 'row', alignContent: 'center', justifyContent: 'center', marginTop: 30}}>
                  <View style={{flexDirection: 'column'}}>
                    <Image source={require('./images/create_child.png')} style={{height: 102, width: 140, marginBottom: -2.5}}/>
                    <TouchableOpacity style={[styles.button, {marginRight: 25}]} onPress={async()=>{
                      if((this.state.myNameWB.length == 0 && this.state.myName.length == 0) || this.state.pw.length == 0 || this.state.pwAgain.length == 0 || this.state.newGameName.length == 0) {
                        this.setState({newGameModalVisible: false});
                        Vibration.vibrate();
                        Alert.alert('Error', 'I saw terrible things... Empty fields. Please fill in the form to continue.', [
                          {text: 'OK', onPress: () => this.setState({newGameModalVisible: true})},
                        ]);
                        return;
                      }

                      if(this.state.myName.length == 0) {
                        await this.setState({myName: this.state.myNameWB, myNameWB: ''});

                        //Save name to AsyncStorage
                        try {
                          await AsyncStorage.setItem('@MySuperStore:name', this.state.myName);
                        } catch (error) {
                          // Error saving data
                          console.log(error);
                        }

                        firebase.database().ref('users/'+this.state.myName).set({
                          name: this.state.myName,
                          points: 0
                        });
                      }

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
                      }}>
                      <ImageBackground source={require('./images/btn.png')} style={{width: 140, height: 58, justifyContent: 'center'}}>
                        <Text style={[styles.join, {fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}>Create</Text>
                      </ImageBackground>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={[styles.button, {marginTop: 99.5}]} onPress={()=>{this.setState({newGameModalVisible: false})}}>
                    <ImageBackground source={require('./images/btn.png')} style={{width: 140, height: 58, justifyContent: 'center'}}>
                      <Text style={[styles.join, {fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}>Cancel</Text>
                    </ImageBackground>
                  </TouchableOpacity>
                </View>
              </ScrollView> 
            </View>
          </Modal>
          <Modal
            animationType="slide"
            transparent={false}
            onRequestClose={()=>this.setState({joinGameModalVisible: false})}
            visible={this.state.joinGameModalVisible}>
            <View style={{flex: 1, backgroundColor: 'white', padding: 20}}>
              <Text style={[styles.heading, {fontSize: 40, marginBottom: 20, fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}>Join "{this.state.joinGameName}"?</Text>
              <View style={{flex: 1}}>
                <View style={{flexDirection: 'column'}}>
                  <View style={{marginLeft: 20, display: this.state.myName.length == 0 ? 'flex' : 'none'}}>
                    <TextInput
                      style={[styles.input, {color: '#666', borderColor: '#666', fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}
                      underlineColorAndroid='transparent'
                      placeholder="Your name (public)"
                      placeholderTextColor="#222"
                      onChangeText={(myNameWB) => this.setState({myNameWB})}
                      value={this.state.myNameWB}
                    />
                    <Image source={require('./images/line_long.png')} />
                    <Text style={{color: '#ee5253', fontSize: 16, marginTop: 10, display: this.state.myNameWB.length == 0 ? 'flex' : 'none', fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}}>Please don't leave any field empty.</Text>
                  </View>
                  <View style={{marginLeft: 20, display: this.state.myName == this.state.joinMaster ? 'flex' : 'none'}}>
                    <TextInput
                      style={[styles.input, {color: '#666', borderColor: '#666', fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}
                      secureTextEntry={true}
                      placeholder="Room master password"
                      placeholderTextColor="#222"
                      underlineColorAndroid='transparent'
                      onChangeText={(joinPw) => this.setState({joinPw})}
                      value={this.state.joinPw}
                    />
                    <Image source={require('./images/line_long.png')} />
                    <Text style={{color: '#ee5253', fontSize: 16, marginTop: 10, display: this.state.joinPw.length == 0 ? 'flex' : 'none', fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}}>Please don't leave any field empty.</Text>
                  </View>
                </View>
                <Image source={require('./images/join_bg.png')} style={{width: 300, height: 295, marginVertical: 20, alignSelf: 'center'}} />
                <View style={[styles.card, {flexDirection: 'row', alignItems: 'center', alignSelf: 'center'}]}>
                  <View style={[styles.button, {flex: 1, marginRight: 25}]}>
                    <TouchableOpacity style={[styles.button, {flex: 1, backgroundColor: 'transparent'}]} onPress={async()=>{
                      if(this.state.myNameWB.length == 0 && this.state.myName.length == 0) {
                        this.setState({joinGameModalVisible: false});
                        Vibration.vibrate();
                        Alert.alert('Error', 'I saw terrible things... Empty fields. Please fill in the form to continue.', [
                          {text: 'OK', onPress: () => this.setState({joinGameModalVisible: true})},
                        ]);
                        return;
                      }

                      if(this.state.myName.length == 0) {
                        await this.setState({myName: this.state.myNameWB, myNameWB: ''});
  
                        //Save name to AsyncStorage
                        try {
                          await AsyncStorage.setItem('@MySuperStore:name', this.state.myName);
                        } catch (error) {
                          // Error saving data
                          console.log(error);
                        }
  
                        firebase.database().ref('users/'+this.state.myName).set({
                          name: this.state.myName,
                          points: 0
                        });
                      }
  
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
                    }}>
                      <ImageBackground source={require('./images/btn.png')} style={{width: 140, height: 58, justifyContent: 'center'}}>
                        <Text style={[styles.join, {fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}>Join</Text>
                      </ImageBackground>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={[styles.button, {flex: 1, backgroundColor: 'white'}]} onPress={()=>{this.setState({joinGameModalVisible: false})}}>
                    <ImageBackground source={require('./images/btn.png')} style={{width: 140, height: 58, justifyContent: 'center'}}>
                      <Text style={[styles.join, {fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}>Cancel</Text>
                    </ImageBackground>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          <Modal
            animationType="slide"
            transparent={false}
            onRequestClose={()=>this.setState({infoModalVisible: false})}
            visible={this.state.infoModalVisible}>
            <ScrollView style={{flex: 1, padding: 25}}>
              <Text style={{fontSize: 40, fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial', marginTop: 20}}>Bullshit Bingo</Text>
              <Text style={{fontFamily: this.state.fontsLoaded ? 'cabin-sketch' : 'Arial', fontSize: 20}}>
                Imagine the endless possibilities of creating a bingo game about anything. Who's going to marry next, what's the next thing that's going to break in the office, etc.{"\n"}{"\n"}
                Well, that's what Bullshit Bingo is about.{"\n"}
                Create a room, share it with your friends, and play together freely.
              </Text>
              <Text style={{fontSize: 40, fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial', marginTop: 15}}>Rules</Text>
              <Text style={{fontFamily: this.state.fontsLoaded ? 'cabin-sketch' : 'Arial', fontSize: 20}}>
                • You can only vote on 2 games{"\n"}
                • Only the room master can delete cards and give points (via 'Bingo!' button){"\n"}
                • The room master can kick anyone{"\n"}
                • Both the kicked players and the quitters can rejoin every room{"\n"}
                • Once the room master exits, the game is going to be deleted, permanently.{"\n"}
                • Have fun! ;)
              </Text>
              <Text style={{fontSize: 40, fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial', marginTop: 15}}>Creator</Text>
              <Text style={{fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial', fontSize: 20}}>This project is fully open-source.</Text>
              <Link text="Bullshit Bingo on GitHub" url="https://github.com/dandesz198/bullshitbingo" />
              <Text style={{fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial', fontSize: 20, marginTop: 10}}>
                Daniel Gergely
              </Text>
              <Link text="GitHub" url="https://github.com/dandesz198" />
              <Link text="Facebook" url="https://fb.me/dandesz198" />
              <Link text="Twitter" url="https://twitter.com/dandesz198" />
              <Link text="LinkedIn" url="https://linkedin.com/in/dandesz198" />
              <Text style={{fontSize: 40, fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial', marginTop: 15}}>Contributor</Text>
              <Text style={{fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial', fontSize: 20}}>
                Péter Hajdu
              </Text>
              <Link text="GitHub" url="https://github.com/razor97" />
              <Link text="Facebook" url="https://fb.me/hajdupetke" />
              <Link text="Twitter" url="https://twitter.com/hajdupetke" />
              <TouchableOpacity style={{marginLeft: 'auto', marginRight: 'auto', marginTop: 15}} onPress={()=>{Linking.openURL('https://paypal.me/dandesz198')}}>
                <Image source={require('./coffee.png')} style={{height: 45, width: 225}}/>
              </TouchableOpacity>
              <Text style={[styles.p, {fontSize: 20, textAlign: 'center', marginTop: 5, fontFamily: this.state.fontsLoaded ? 'cabin-sketch' : 'Arial'}]}>Since the server isn't free, every single cent of your donation is going to be spent on the costs of running this game.</Text>
              <View style={{flex: 1, marginTop: 20, marginBottom: 40, height: 50}}>
                <TouchableOpacity style={[styles.button, {flex: 1, shadowColor: 'transparent', backgroundColor: 'transparent'}]} onPress={()=>{this.setState({infoModalVisible: false})}}>
                  <ImageBackground source={require('./images/btn_wide.png')} style={{width: 330, height: 64, alignItems: 'center', justifyContent: 'center'}}>
                    <Text style={[styles.join, {fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}>Close</Text>
                  </ImageBackground>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Modal>
          <ScrollView style={{flex: 1}}>
            <View style={{marginTop: 20, flexDirection: 'row', width: Dimensions.get('window').width}}>
              <Text style={[styles.welcome, {fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}>Bullshit Bingo</Text>
              <TouchableOpacity onPress={() => {this.setState({infoModalVisible: true})}}>
                <Text style={{fontSize: 16, marginTop: 'auto', marginBottom: 5, marginLeft: 7.5, marginRight: 'auto', fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}}>0.12 [i]</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.button, {marginTop: 10}]} onPress={()=>{this.setState({newGameModalVisible: true})}}>
              <ImageBackground source={require('./images/btn_wide.png')} style={{width: 330, height: 64, alignItems: 'center', justifyContent: 'center'}}>
                <Text style={[styles.join, {fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}>Create a new room</Text>
              </ImageBackground>
            </TouchableOpacity>
            <Text style={[styles.heading, {fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}>Join a room</Text>
            <View style={{flexDirection: 'row', justifyContent: 'center'}}>
              <Image source={require('./images/home_child.png')} style={{height: 180, width: 105, marginTop: 10, marginLeft: 0, marginRight: 'auto'}} />
              <View style={{flexDirection: 'column', height: 140, alignItems: 'center', marginRight: 'auto', marginTop: 'auto', marginBottom: 'auto'}}>              
                <TextInput
                  style={[styles.input, {flex: 1, height: 40, width: 140, fontSize: 28, textAlign: 'center', fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}
                  placeholder="Room PIN"
                  placeholderTextColor="#222"
                  keyboardType="numeric"
                  underlineColorAndroid='transparent'
                  onChangeText={(joingameId) => this.setState({joingameId})}
                  value={this.state.joingameId}
                />
                <Image source={require('./images/line_short.png')} style={{width: 140, marginTop: 5, marginBottom: 10}} />
                <Text style={{color: '#ee5253', fontSize: 16, display: this.state.isNewGameIDCorrect ? 'none' : 'flex', fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}}>Please check the PIN.</Text>
                <TouchableOpacity style={[styles.button, {marginTop: 5}]}
                onPress={()=>{
                  var thus = this;

                  if(this.state.joingameId.length < 6) {
                    //Alert.alert("Error", "Something bad happened (maybe). Please check the game PIN and/or try again later.");
                    this.setState({isNewGameIDCorrect: false});
                    Vibration.vibrate();
                    return;
                  }
    
                  //Get the name and the master's name of the new room
                  firebase.database().ref('games/' + this.state.joingameId).once('value', function(snap) {
                    if(typeof snap.val() != "undefined" && snap.val() != null) {
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
                  }}
                  >
                  <ImageBackground source={require('./images/btn.png')} style={{width: 140, height: 58, justifyContent: 'center'}}>
                    <Text style={[styles.join, {fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}>Join</Text>
                  </ImageBackground>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.heading, {fontFamily: this.state.fontsLoaded ? 'cabin-sketch-bold' : 'Arial'}]}>My rooms</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <ListView
                dataSource={ds.cloneWithRows(this.state.games)}
                enableEmptySections={true}
                renderRow={(rowData) => 
                  <TouchableOpacity style={{padding: 2.5, marginLeft: 20}} onPress={()=>{
                    this.props.navigation.navigate('Room', {gameName: rowData.name, gameId: rowData.id, myName: this.state.myName, returnData: this.returnData.bind(this)});
                    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
                  }}>
                    <Text style={[styles.gameList, {fontFamily: this.state.fontsLoaded ? 'cabin-sketch' : 'Arial'}]}>{rowData.name}</Text>
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
    fontSize: 45,
    marginLeft: 20,
    marginTop: 20
  },

  heading: {
    fontSize: 35,
    marginTop: 30,
    marginLeft: 20
  },

  input: {
    padding: 5,
    fontSize: 24
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
    fontSize: 38
  },

  p: {
    fontSize: 26
  },

  onboardContainter: {
    width: Dimensions.get('window').width, 
    height: Dimensions.get('window').height, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 30
  },

  card: {
    width: Dimensions.get('window').width * 0.9,
    marginHorizontal: Dimensions.get('window').width * 0.05,
    marginVertical: 10,
    padding: 15
  }
});