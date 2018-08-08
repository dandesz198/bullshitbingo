import { CREATE_ROOM, DELETE_ROOM /* , FETCH, KICK */ } from '../actions';

export default function reducer(state = [], action) {
  switch (action.type) {
    case CREATE_ROOM:
      return [action.payload, ...state];
    case DELETE_ROOM: {
      const rooms = state.filter(room => room.roomID !== action.payload);
      return [...rooms];
    }
    // HANDLE FETCH AND KICK
    default:
      return state;
  }
}
