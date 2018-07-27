import { createStackNavigator } from 'react-navigation';
import Home from './screens/Home';
import Match from './screens/Match';
import Room from './screens/Room';

export default createStackNavigator(
  {
    Home: { screen: Home },
    Match: { screen: Match },
    Room: { screen: Room },
  },
  {
    initialRouteName: 'Home',
    headerMode: 'none',
  }
);
