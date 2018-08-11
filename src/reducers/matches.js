import {
  FETCH,
  CREATE_MATCH,
  DELETE_MATCH,
  FETCH_MATCHES,
  KICK,
} from '../actions';

export default function reducer(state = [], action) {
  switch (action.type) {
    case FETCH:
      return [];
    case CREATE_MATCH:
      return [action.payload, ...state];
    case DELETE_MATCH: {
      const matches = state.filter(match => match.matchID !== action.payload);
      return [...matches];
    }
    case FETCH_MATCHES:
      return [...action.payload, ...state];
    case KICK:
      return [...state];
    default:
      return state;
  }
}
