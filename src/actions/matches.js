import * as firebase from 'firebase';

import { CREATE_MATCH, DELETE_MATCH } from './types';

export const createMatch = (roomID, match) => (dispatch, getState) => {
  const { rooms } = getState();
  const room = rooms.find(room => room.roomID === roomID);
  const index = rooms.indexOf(room);

  if (!room.matches) {
    room.matches = [match];
  } else {
    room.matches.unshift(match);
  }

  firebase
    .database()
    .ref(`rooms/${roomID}/`)
    .update({
      matches: room.matches,
    });

  rooms[index] = room;

  dispatch({
    type: CREATE_MATCH,
    payload: [...rooms],
  });
};

export const deleteMatch = (roomID, match) => (dispatch, getState) => {
  const { rooms } = getState();
  const room = rooms.find(room => room.roomID === roomID);
  const index = rooms.indexOf(room);

  room.matches.splice(room.matches.indexOf(match));

  firebase
    .database()
    .ref(`rooms/${roomID}/`)
    .update({
      matches: room.matches,
    });

  rooms[index] = room;

  dispatch({
    type: DELETE_MATCH,
    payload: [...rooms],
  });
};

export default {};
