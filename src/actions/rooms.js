import * as firebase from 'firebase';

import { CREATE_ROOM } from './types';

export const createRoom = room => async dispatch => {
  const { name, master, masterPw, gameID } = room;

  await firebase
    .database()
    .ref(`games/${gameID}`)
    .set({
      name,
      master,
      masterPw,
      members: [master],
    });
  dispatch({
    type: CREATE_ROOM,
    payload: {
      name,
      master,
      masterPw,
      members: [master],
      gameID,
    },
  });
};

export default {};
