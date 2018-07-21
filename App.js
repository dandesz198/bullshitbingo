import { createStackNavigator } from 'react-navigation';
import Home from './src/screens/Home';
import Match from './src/screens/Match';
import Room from './src/screens/Room';

const App = createStackNavigator(
  {
    Home: { screen: Home },
    Match: { screen: Match },
    Room: { screen: Room },
  },
  {
    headerMode: 'none',
  }
);

export default App;
