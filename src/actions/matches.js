import * as firebase from 'firebase';

import { CREATE_MATCH, DELETE_MATCH } from './types';

// NEW
export const createMatch = match => (dispatch, getState) => {
  const { matches } = getState();
  let roomMatches = matches.filter(
    matchFromState => matchFromState.roomID === match.roomID
  );

  roomMatches = roomMatches.length > 0 ? [...roomMatches, match] : [match];

  firebase
    .database()
    .ref(`rooms/${match.roomID}/`)
    .update({
      matches: [roomMatches],
    });

  dispatch({
    type: CREATE_MATCH,
    payload: match,
  });
};

// CHECK NEEDED
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
