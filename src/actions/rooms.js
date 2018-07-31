import * as firebase from 'firebase';

import { CREATE_ROOM, DELETE_ROOM } from './types';

export const createRoom = room => async (dispatch, getState) => {
  const { name, masterPw, roomID } = room;
  const { user } = getState();
  const { myName, points } = user;

  await firebase
    .database()
    .ref(`rooms/${roomID}`)
    .set({
      name,
      myName,
      masterPw,
      members: [{ myName, points }],
    });

  dispatch({
    type: CREATE_ROOM,
    payload: {
      name,
      myName,
      members: [{ myName, points }],
      roomID,
    },
  });
};

export const joinRoom = roomID => async (dispatch, getState) => {
  const { myName } = getState().user;

  await firebase
    .database()
    .ref(`rooms/${roomID}/`)
    .once('value', snap => {
      const { members, master } = Object.values(snap.val());
      if (members.indexOf(myName) === -1) {
        firebase
          .database()
          .ref(`rooms/${roomID}/members/`)
          .push(myName);
      }

      dispatch({
        type: CREATE_ROOM,
        payload: {
          name,
          master,
          members,
          roomID,
        },
      });
    });
};

export const deleteRoom = roomID => async dispatch => {
  firebase
    .database()
    .ref(`rooms/${roomID}`)
    .remove();

  dispatch({
    type: DELETE_ROOM,
    payload: roomID,
  });
};

export const checkRoom = roomID => async getState => {
  const { myName } = getState().user;

  firebase
    .database()
    .ref(`rooms/${roomID}/members/`)
    .once('value')
    .then(snap => {
      if (snap.val()) {
        const members = Object.values(snap.val());
        // If member even exists
        if (members) {
          // If room doesn't exist or player is kicked
          if (members.length < 0 || members.indexOf(myName) === -1) {
            deleteRoom(roomID);
          }
        } else {
          deleteRoom(roomID);
        }
      } else {
        deleteRoom(roomID);
      }
    });
};

export default {};
