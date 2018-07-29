import {
  CREATE_ROOM,
  DELETE_ROOM,
  CREATE_MATCH,
  DELETE_MATCH,
  CREATE_CARD,
  DELETE_CARD,
} from '../actions';

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
    case DELETE_ROOM: {
      const rooms = state.filter(room => room.id !== action.payload);
      return [...rooms];
    }
    default:
      return state;
  }
}
