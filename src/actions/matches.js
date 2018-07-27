import * as firebase from 'firebase';

import { CREATE_ROOM } from './types';

export const createRoomAction = room => async dispatch => {
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

  await checkId();

  const { name, master, masterPw } = room;

  await firebase
    .database()
    .ref(`games/${newGameID}`)
    .set({
      name,
      master,
      masterPw,
      members: [name],
    });
  dispatch({
    type: CREATE_ROOM,
    payload: { ...room, id: newGameID },
  });
};

export default {};
