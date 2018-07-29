import * as firebase from 'firebase';

import { HIDE_ONBOARDING, UPDATE_NAME } from './types';

export const hideOnboarding = () => async dispatch => {
  dispatch({
    type: HIDE_ONBOARDING,
  });
};

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
