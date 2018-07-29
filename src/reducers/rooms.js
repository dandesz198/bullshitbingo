import { CREATE_ROOM, CREATE_MATCH, CREATE_CARD } from '../actions';

export default function reducer(state = [], action) {
  switch (action.type) {
    case CREATE_ROOM:
      return [...state, action.payload];
    case CREATE_MATCH:
      // return [...state, action.payload];
      return state;
    case CREATE_CARD:
      // return [...state, action.payload];
      return state;
    default:
      return state;
  }
}
