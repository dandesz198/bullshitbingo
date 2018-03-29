import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as firebase from 'firebase';

class Card extends Component {
    constructor(props) {
        super(props)
        this.state = {
            text: "Vote",
            pressed: false,
        }
    }

    render() {
        return(
            <View style={style.boxStyle}>
                <View style={style.textBoxStyle}>
                    <Text style={style.roomNameText}>{this.props.matchName}</Text>
                    <Text style={style.nameText}>{this.props.cardText}</Text>
                </View>
                <View style={style.buttonBoxStyle}>
                    <TouchableOpacity style={style.buttonStyle} onPress={() => this.setState({text: this.state.text == 'Vote' ? 'Voted' : 'Vote'})}>
                        <Text style={style.buttonText}>{this.state.text}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[style.buttonStyle, style.secondButton, this.state.pressed ? style.buttonStylePressed :style.buttonStyle]} onPress={() => this.setState({pressed: !this.state.pressed})}>
                        <Text style={style.buttonText}>Bingo</Text>
                    </TouchableOpacity>
                    <Text style={style.voteNumberStyle}>10 votes</Text>
                </View>
            </View>
        )
    }
}

const style = StyleSheet.create({
    boxStyle: {
        shadowColor: '#999',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.7,
        // background color must be set
        backgroundColor : "#0000", // invisible color
        marginVertical: 12.5,
        marginHorizontal: 2.5,
        elevation: 1,
        zIndex: 999,
        display: 'flex',
    }, 

    /*UPPERBOX*/

    textBoxStyle: {
        padding: 10,
        backgroundColor: '#E5E7E9'
    },

    /*UPPERBOX TEXT*/

    roomNameText: {
        fontSize: 20,
        color: '#95a5a6'
    },

    nameText: {
        color: '#555',
        fontSize: 35,
        fontWeight: '600'
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
        backgroundColor: "#555",
        borderRadius: 5,
        justifyContent: 'center',
        width: 100,
        height: 30
    },

    buttonStylePressed: {
        backgroundColor: "green",
    },

    secondButton: {
        marginLeft: 10,
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