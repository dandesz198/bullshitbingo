import { Dimensions, StyleSheet } from 'react-native';

export default StyleSheet.create({
  onboardContainter: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
  },
});
