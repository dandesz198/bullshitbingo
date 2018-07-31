import * as firebase from 'firebase';

import { CREATE_MATCH } from './types';

export const createMatch = (roomID, match) => async (dispatch, getState) => {
  const { rooms } = getState();
  let { matches } = rooms.find(room => room.roomID === roomID);

  if (!matches) {
    matches = [match];
  } else {
    matches.unshift(match);
  }

  firebase
    .database()
    .ref(`rooms/${roomID}/`)
    .update({
      matches,
    });

  dispatch({
    type: CREATE_MATCH,
    payload: { rooms },
  });
};

export default {};
