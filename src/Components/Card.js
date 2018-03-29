import React, { Component } from 'react'
import { View, Text, StyleSheet,Button } from 'react-native'

class Card extends Component {
    constructor(props) {
        super(props)
    }
    render() {
        return(
            <View style={style.boxStyle}>
                <Text>{this.props.cardText}</Text>
                <Text>{this.props.voteNumber}</Text>
            </View>
        )
    }
}

const style = StyleSheet.create({
    boxStyle: {

    },
    cardText: {

    },

})

export default Card;