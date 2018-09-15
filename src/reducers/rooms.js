import { CREATE_ROOM, DELETE_ROOM, FETCH_ROOMS, KICK } from '../actions';

export default function reducer(state = [], action) {
  switch (action.type) {
    case CREATE_ROOM:
      return [action.payload, ...state];
    case DELETE_ROOM: {
      const rooms = state.filter(room => room.roomID !== action.payload);
      return [...rooms];
    }
    case FETCH_ROOMS:
      return [...action.payload];
    case KICK:
      return [...state];
    default:
      return state;
  }
}
