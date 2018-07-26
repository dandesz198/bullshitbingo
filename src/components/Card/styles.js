import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  roomNameText: {
    fontSize: 18,
    fontFamily: 'CabinSketch-Regular',
  },

  nameText: {
    fontSize: 32,
    marginVertical: 5,
    fontFamily: 'CabinSketch-Bold',
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
    fontFamily: 'CabinSketch-Bold',
  },

  voteNumberStyle: {
    alignSelf: 'center',
    paddingLeft: 15,
    paddingRight: 15,
    fontSize: 15,
    textAlign: 'right',
    flex: 1,
    fontFamily: 'CabinSketch-Regular',
  },
});
