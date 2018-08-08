import * as firebase from 'firebase';

import { CREATE_MATCH, DELETE_MATCH } from './types';

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
    payload: { ...match },
  });
};

export const deleteMatch = (roomID, matchID) => (dispatch, getState) => {
  const { rooms } = getState();
  const { matches } = rooms.find(room => room.roomID === roomID);

  matches.splice(matches.indexOf(matchID));

  firebase
    .database()
    .ref(`rooms/${roomID}/`)
    .update({
      matches,
    });

  dispatch({
    type: DELETE_MATCH,
    payload: matchID,
  });
};

export default {};
