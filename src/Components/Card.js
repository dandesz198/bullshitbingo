import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import * as firebase from 'firebase';
import { Analytics, PageHit, Event } from 'expo-analytics';

let Environment = require('../environment.js')
let analytics = new Analytics(Environment.analytics);

class Card extends Component {
    render() {
        return(
            <View style={style.boxStyle}>
                <View style={style.textBoxStyle}>
                    <View style={{flexDirection: 'row', height: 20}}>
                        <Text style={style.roomNameText}>{this.props.matchName}</Text>
                        <Text style={[style.roomNameText, {marginRight: 0, marginLeft: 'auto'}]}>{this.props.creatorName}</Text>
                    </View>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={style.nameText}>{this.props.cardText}</Text>
                        <TouchableOpacity style={{marginRight: 0, marginLeft: 'auto', display: this.props.isGameMaster && !this.props.isMatch ? 'flex' : 'none'}} onPress={() => {this.props.onDeletePress(); analytics.event(new Event(this.props.isMatch ? 'Delete match' :  'Delete card'));}}>
                            <Image source={require('./delete.png')} style={{height: 22.5, width: 22.5, marginVertical: 'auto'}} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={style.buttonBoxStyle}>
                    <Animated.View style={{width: 100, height: 30, marginRight: 10, borderRadius: 5, backgroundColor: this.props.voted ? this.props.bgColor : '#555', display: this.props.isBingo ? 'none' :  'flex'}}>
                        <TouchableOpacity style={[style.buttonStyle, {backgroundColor: 'transparent'}]} onPress={() => {this.props.onVotePress()}}>
                            <Text style={[style.buttonText]}>{this.props.isMatch ? 'Join' : 'Vote'}</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View style={[style.buttonStyle, {backgroundColor: this.props.isBingo ? this.props.bgColor : '#555', display: this.props.isGameMaster ? 'flex' :  'none'}]}>
                        <TouchableOpacity style={[style.buttonStyle, {backgroundColor: 'transparent'}]} onPress={() => {this.props.onBingoPress()}}>
                        <Text style={style.buttonText}>{this.props.isMatch ? 'Delete' : 'Bingo'}</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <Text style={[style.voteNumberStyle, {display: this.props.isMatch ?  'none' : 'flex'}]}>{this.props.voteCount} votes</Text>
                </View>
            </View>
        )
    }
}

let style = StyleSheet.create({
    boxStyle: {
        shadowColor: '#999',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.7,
        // background color must be set
        backgroundColor : "#0000", // invisible color
        marginVertical: 12.5,
        marginHorizontal: 15,
        display: 'flex',
        elevation: 3
    }, 

    /*UPPERBOX*/

    textBoxStyle: {
        padding: 10,
        backgroundColor: '#E5E7E9'
    },

    /*UPPERBOX TEXT*/

    roomNameText: {
        fontSize: 15,
        color: '#95a5a6'
    },

    nameText: {
        color: '#555',
        fontSize: 35,
        fontWeight: '600',
        marginVertical: 5
    },

    /*LOWERBOX*/ 

    buttonBoxStyle: {
        backgroundColor: '#bdc3c7',
        display: "flex",
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexDirection: 'row',
        padding: 10
    },

    buttonStyle: {
        justifyContent: 'center',
        width: 100,
        height: 30,
        backgroundColor: '#555',
        borderRadius: 5
    },

    /*LOWERBOX TEXT*/

    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        textAlign: 'center',
        fontSize: 15,
    },
    voteNumberStyle: {
        alignSelf: 'center',
        paddingLeft: 15,
        paddingRight: 15,
        color: '#7B7D7D',
        fontSize: 15,
        textAlign: 'right',
        flex: 1,
    }
})

export default Card;