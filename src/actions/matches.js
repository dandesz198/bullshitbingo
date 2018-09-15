import * as firebase from 'firebase';

import { CREATE_MATCH, DELETE_MATCH } from './types';

/**
 * This action is dispacted when someone creates a new match
 *
 * @param {string} match - The new match
 */
export const createMatch = match => dispatch => {
  firebase
    .database()
    .ref(`rooms/${match.roomID}/matches/${match.matchID}`)
    .update({
      ...match,
    });

  dispatch({
    type: CREATE_MATCH,
    payload: { ...match },
  });
};

/**
 * This action is dispacted when the master deletes a match
 *
 * @param {string} roomID - The ID of the room the match is located in
 * @param {string} matchID - The ID of the match that needs to be deleted
 */
export const deleteMatch = (roomID, matchID) => (dispatch, getState) => {
  let { matches } = getState();

  matches = matches.filter(match => match.matchID !== matchID);

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
