import React from 'react';
import { StackNavigator } from 'react-navigation';
import Home from './Home.js';

export default StackNavigator({
  Home: {
    screen: Home,
  },
});