import { CREATE_ROOM } from '../actions/types';

export default function reducer(state = [], action) {
  switch (action.type) {
    case CREATE_ROOM:
      return [...state, action.payload];
    default:
      return state;
  }
}
