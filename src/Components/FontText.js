import React, { Component } from 'react';
import { Text, Platform } from 'react-native';

export default class FontText extends Component {
    render() {
        if(this.props.isLoaded) {
            return(
                <Text style={[{fontFamily: this.props.isBold ? 'cabin-sketch-bold' :  'cabin-sketch'}, this.props.style]}>{this.props.children}</Text>
            )
        } else {
            return null;
        }
    }
}