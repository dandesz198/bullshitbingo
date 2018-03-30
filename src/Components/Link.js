import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Dimensions } from 'react-native';

class Link extends Component {
    render() {
        return(
            <TouchableOpacity style={{height: 16, width: Dimensions.get('window').width * (60 / 100)}} onPress={()=>{Linking.openURL(this.props.url)}}>
                <Text style={styles.link}>{this.props.text}</Text>
            </TouchableOpacity>
        )
    }
}

let styles = StyleSheet.create({
    link: {
        color: '#3498db', 
        fontSize: 16, 
        textDecorationLine: 'underline'
    }
})

export default Link;