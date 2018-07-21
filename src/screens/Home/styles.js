import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  welcome: {
    fontSize: 40,
    marginLeft: 20,
    marginTop: 20,
  },
  heading: {
    fontSize: 30,
    marginTop: 30,
    marginLeft: 20,
  },
  input: {
    padding: 5,
    fontSize: 20,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  join: {
    fontSize: 30,
    textAlign: 'center',
  },
  gameList: {
    fontSize: 30,
    marginVertical: 5,
  },
  h2: {
    fontSize: 34,
  },
  p: {
    fontSize: 24,
  },
  onboardContainter: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
  },
  card: {
    width: Dimensions.get('window').width * 0.9,
    marginHorizontal: Dimensions.get('window').width * 0.05,
    marginVertical: 10,
    padding: 15,
  },
});
