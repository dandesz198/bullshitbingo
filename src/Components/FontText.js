import React, { Component } from 'react';
import { Text } from 'react-native';

export default class FontText extends Component {
    render() {
        return(
            <Text style={[{fontFamily: this.props.isLoaded ?  (this.props.isBold ? 'cabin-sketch-bold' :  'cabin-sketch') :  'Arial'}, this.props.style]}>{this.props.children}</Text>
        )
    }
}