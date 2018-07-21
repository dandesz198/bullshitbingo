import { StackNavigator } from 'react-navigation';
import { Home, Match, Room } from './src/screens';

export default StackNavigator(
  {
    Home: { screen: Home },
    Match: { screen: Match },
    Room: { screen: Room },
  },
  {
    headerMode: 'none',
  }
);
