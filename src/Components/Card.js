import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground, Dimensions } from 'react-native';
import * as firebase from 'firebase';
import { Analytics, PageHit, Event } from 'expo-analytics';

let Environment = require('../environment.js')
let analytics = new Analytics(Environment.analytics);

class Card extends Component {
    render() {
        return(
            <ImageBackground resizeMode='stretch' source={require('../images/card.png')} style={{width: Dimensions.get('window').width * (95 / 100), minHeight: 100, marginLeft: 'auto', marginRight: 'auto', padding: 20, marginTop: 20}}>
                <View style={style.textBoxStyle}>
                    <View style={{flexDirection: 'row', height: 20}}>
                        <Text numberOfLines={1} style={[style.roomNameText, {maxWidth: Dimensions.get('window').width * (50 / 100)}]}>{this.props.matchName}</Text>
                        <Text style={[style.roomNameText, {marginRight: 0, marginLeft: 'auto'}]}>{this.props.creatorName}</Text>
                    </View>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={[style.nameText, {width: Dimensions.get('window').width * (75 / 100)}]} numberOfLines={1}>{this.props.cardText}</Text>
                        <TouchableOpacity style={{marginRight: 0, marginLeft: 'auto', display: this.props.isGameMaster && !this.props.isMatch ? 'flex' : 'none'}} onPress={() => {this.props.onDeletePress(); analytics.event(new Event(this.props.isMatch ? 'Delete match' :  'Delete card'));}}>
                            <Image source={require('./trash.png')} style={{height: 30, width: 21, marginVertical: 'auto'}} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={style.buttonBoxStyle}>
                    <TouchableOpacity style={[style.buttonStyle, {marginRight: 10, borderRadius: 5, display: this.props.isBingo ? 'none' :  'flex'}]} onPress={() => {this.props.onVotePress()}}>
                        <ImageBackground source={!this.props.isMatch && this.props.voted ? require('../images/btn_filled.png') : require('../images/btn.png')} style={{width: 84, height: 35, justifyContent: 'center'}}>
                            <Text style={{fontSize: 18, textAlign: 'center', fontFamily: 'cabin-sketch-bold', color: !this.props.isMatch && this.props.voted ? 'white' : 'black'}}>{this.props.isMatch ? 'Join' : 'Vote'}</Text>
                        </ImageBackground>
                    </TouchableOpacity>

                    <TouchableOpacity style={[style.buttonStyle, {display: this.props.isGameMaster ? 'flex' : (this.props.isBingo ? 'flex' : 'none')}]} onPress={() => {this.props.onBingoPress()}}>
                        <ImageBackground source={!this.props.isMatch && this.props.isBingo ? require('../images/btn_filled.png') : require('../images/btn.png')} style={{width: 84, height: 35, justifyContent: 'center'}}>
                            <Text style={{fontSize: 18, textAlign: 'center', fontFamily: 'cabin-sketch-bold', color: !this.props.isMatch && this.props.isBingo ? 'white' : 'black'}}>{this.props.isMatch ? 'Delete' : 'Bingo'}</Text>
                        </ImageBackground>
                    </TouchableOpacity>

                    <Text style={[style.voteNumberStyle, {display: this.props.isMatch ? 'none' : 'flex'}]}>{this.props.voteCount} votes</Text>
                </View>
            </ImageBackground>
        )
    }
}

let style = StyleSheet.create({
    roomNameText: {
        fontSize: 20,
        fontFamily: 'cabin-sketch'
    },

    nameText: {
        fontSize: 35,
        marginVertical: 5,
        fontFamily: 'cabin-sketch-bold'
    },

    /*LOWERBOX*/ 

    buttonBoxStyle: {
        display: "flex",
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexDirection: 'row'
    },

    buttonStyle: {
        justifyContent: 'center',
    },

    /*LOWERBOX TEXT*/

    buttonText: {
        color: "#fff",
        fontSize: 15,
        fontFamily: 'cabin-sketch-bold'
    },

    voteNumberStyle: {
        alignSelf: 'center',
        paddingLeft: 15,
        paddingRight: 15,
        fontSize: 15,
        textAlign: 'right',
        flex: 1,
        fontFamily: 'cabin-sketch'
    }
})

export default Card;