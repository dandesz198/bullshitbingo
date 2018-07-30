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
    case DELETE_ROOM: {
      const rooms = state.filter(room => room.id !== action.payload);
      return [...rooms];
    }
    case CREATE_MATCH: {
      const rooms = state.filter(room => room.id !== action.payload.roomID);
      const room = state.filter(room => room.id === action.payload.roomID);
      room.matches.unshift(action.payload.match);
      return [...rooms, room];
    }
    case DELETE_MATCH: {
      const rooms = state.filter(room => room.id !== action.payload);
      return [...rooms];
    }
    case CREATE_CARD: {
      const rooms = state.filter(room => room.id !== action.payload.roomID);
      const room = state.filter(room => room.id === action.payload.roomID);
      const matches = state.filter(room => room.id !== action.payload.matchID);
      const match = state.filter(room => room.id === action.payload.matchID);
      match.cards.unshift(action.payload.card);
      room.matches = [...matches, match];
      return [...rooms, room];
    }
    case DELETE_CARD: {
      const rooms = state.filter(room => room.id !== action.payload);
      return [...rooms];
    }
    default:
      return state;
  }
}
