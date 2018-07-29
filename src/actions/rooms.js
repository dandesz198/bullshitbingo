import * as firebase from 'firebase';

import { CREATE_ROOM, DELETE_ROOM } from './types';

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
      members: [master],
      id: gameID,
    },
  });
};

export const joinRoom = id => async (dispatch, getState) => {
  const { myName } = getState().user;

  await firebase
    .database()
    .ref(`games/${id}/`)
    .once('value', snap => {
      const { members, master } = Object.values(snap.val());
      if (members.indexOf(myName) === -1) {
        firebase
          .database()
          .ref(`games/${id}/members/`)
          .push(myName);
      }

      dispatch({
        type: CREATE_ROOM,
        payload: {
          name,
          master,
          members,
          id,
        },
      });
    });
};

export const deleteRoom = id => async dispatch => {
  dispatch({
    type: DELETE_ROOM,
    payload: id,
  });
};

export const checkRoom = id => async getState => {
  const { myName } = getState().user;
  firebase
    .database()
    .ref(`games/${id}/members/`)
    .once('value')
    .then(snap => {
      let count = 0;
      if (snap.val()) {
        const members = Object.values(snap.val());
        members.forEach(lm => {
          if (lm === myName) {
            count += 1;
          }
        });
        // If member even exists
        if (members) {
          // If room doesn't exist or player is kicked
          if (members.length < 0 || count <= 0) {
            deleteRoom(id);
          }
        } else {
          deleteRoom(id);
        }
      } else {
        deleteRoom(id);
      }
    });
};

export default {};
