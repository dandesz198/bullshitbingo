import React from 'react';
import { StackNavigator } from 'react-navigation';
import Home from './src/Home.js';
import Match from './src/Match.js';
import Room from './src/Room.js';

export default StackNavigator({
  Home: { screen: Home },
  Match: { screen: Match },
  Room: { screen: Room },
  }, { 
    headerMode: 'none'
  }
)