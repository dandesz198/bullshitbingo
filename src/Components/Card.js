import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

class Card extends Component {
    constructor(props) {
        super(props)
        this.state = {
            text: "Vote!",
            pressed: false,
        }
    }

    render() {
        return(
            <View style={style.boxStyle}>
                <View style={style.textBoxStyle}>
                    <Text style={style.roomNameText}>{this.props.roomName}</Text>
                    <Text style={style.nameText}>{this.props.voteName}</Text>
                </View>
                <View style={style.buttonBoxStyle}>
                    <TouchableOpacity style={style.buttonStyle} onPress={() => this.setState({text: 'Voted'})}>
                        <Text style={style.buttonText}>{this.state.text}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[style.secondButton, this.state.pressed ? style.buttonStylePressed :style.buttonStyle]} onPress={() => this.setState({pressed: true})}>
                        <Text style={style.buttonText}>Bingo</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }
}

const style = StyleSheet.create({
    boxStyle: {
        shadowOffset: { width: 10, height: 10 },
        shadowColor: 'black',
        shadowOpacity: 1,
        elevation: 3,
        // background color must be set
        backgroundColor : "#0000", // invisible color
        margin: 10,
        zIndex:999,
        display: 'flex',
    }, 
    
    roomNameText: {
        color: '#95a5a6'
    },

    nameText: {
        color: '#555',
        fontSize: 30,
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
        padding: 10,
    },

    buttonStyle: {
        backgroundColor: "#555",
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 30,
        paddingRight: 30,
        borderRadius: 5
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
    }
})

export default Card;