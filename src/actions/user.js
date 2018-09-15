import * as firebase from 'firebase';

import { HIDE_ONBOARDING, UPDATE_NAME } from './types';

/**
 * This is a helper action only dispatched when the user starts the app for the first time after the onboarding screen
 */
export const hideOnboarding = () => async dispatch => {
  dispatch({
    type: HIDE_ONBOARDING,
  });
};

/**
 * This action is dispacted when the user creates/updates it's own name
 *
 * @param {object} name - The user's new name
 */
export const updateName = name => async dispatch => {
  firebase
    .database()
    .ref(`users/${name}`)
    .once('value', snap => {
      if (typeof snap.val() === 'undefined' || snap.val() === null) {
        firebase
          .database()
          .ref(`users/${name}`)
          .set({
            name,
            points: 0,
          });
      }
    });

  dispatch({
    type: UPDATE_NAME,
    payload: name,
  });
};

export default {};
