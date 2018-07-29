// import * as firebase from 'firebase';

import { CREATE_MATCH } from './types';

export const createMatch = match => async dispatch => {
  dispatch({
    type: CREATE_MATCH,
    payload: { match },
  });
};

export default {};
