import React from 'react';
import { Platform } from 'react-native';
import { StackNavigator } from 'react-navigation';
import Home from './src/Home.js';
import Game from './src/Game.js';

export default StackNavigator(
  { 
    Home: { screen: Home }, 
    Game: { screen: Game } 
  },
  { headerMode: 'none' }
);