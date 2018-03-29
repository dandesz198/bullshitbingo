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
                    <TouchableOpacity style={[style.secondButton, this.state.pressed ? style.buttonStylePressed :style.buttonStyle]} onPress={() => this.setState({pressed: !this.state.pressed})}>
                        <Text style={style.buttonText}>Bingo</Text>
                    </TouchableOpacity>
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
        zIndex: 999,
        display: 'flex',
    }, 

    roomNameText: {
        fontSize: 20,
        color: '#95a5a6'
    },

    nameText: {
        color: '#555',
        fontSize: 35,
        fontWeight: '600'
    },

    textBoxStyle: {
        padding: 10,
        backgroundColor: '#ecf0f1'
    },

    buttonBoxStyle: {
        backgroundColor: '#bdc3c7',
        display: "flex",
        alignItems: 'flex-start',
        flexDirection: 'row',
        padding: 10
    },

    buttonStyle: {
        backgroundColor: "#555",
        fontSize: 20,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 30,
        paddingRight: 30,
        borderRadius: 5,
        width: 100
    },

    buttonStylePressed: {
        backgroundColor: "green",
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 30,
        paddingRight: 30,
        borderRadius: 5
    },

    secondButton: {
        marginLeft: 10,
    },

    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        textAlign: 'center'
    }
})

export default Card;