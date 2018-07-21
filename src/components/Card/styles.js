import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  roomNameText: {
    fontSize: 18,
    fontFamily: 'cabin-sketch',
  },

  nameText: {
    fontSize: 32,
    marginVertical: 5,
    fontFamily: 'cabin-sketch-bold',
  },

  /* LOWERBOX */

  buttonBoxStyle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },

  buttonStyle: {
    justifyContent: 'center',
  },

  /* LOWERBOX TEXT */

  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'cabin-sketch-bold',
  },

  voteNumberStyle: {
    alignSelf: 'center',
    paddingLeft: 15,
    paddingRight: 15,
    fontSize: 15,
    textAlign: 'right',
    flex: 1,
    fontFamily: 'cabin-sketch',
  },
});
