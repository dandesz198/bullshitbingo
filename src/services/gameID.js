import * as firebase from 'firebase';

export const createId = () => {
  const newId = () => Math.floor(Math.random() * 899999 + 100000).toString();
  let newGameID = newId();
  const checkId = () => {
    firebase
      .database()
      .ref(`games/${newGameID}`)
      .once('value', snap => {
        // Check if the game exists
        if (typeof snap.val() !== 'undefined' && snap.val() !== null) {
          newGameID = newId();
          checkId();
        }
      });
  };
  return newGameID;
};

export default {};
