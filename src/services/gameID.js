import * as firebase from 'firebase';

export const createId = () => {
  const newId = () => Math.floor(Math.random() * 899999 + 100000).toString();
  let newRoomID = newId();
  const checkId = () => {
    firebase
      .database()
      .ref(`rooms/${newRoomID}`)
      .once('value', snap => {
        // Check if the room exists
        if (typeof snap.val() !== 'undefined' && snap.val() !== null) {
          newRoomID = newId();
          checkId();
        }
      });
  };
  return newRoomID;
};

export default {};
