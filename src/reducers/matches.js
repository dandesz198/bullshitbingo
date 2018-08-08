import { CREATE_MATCH, DELETE_MATCH /* , FETCH, KICK */ } from '../actions';

export default function reducer(state = [], action) {
  switch (action.type) {
    case CREATE_MATCH:
      return [{ ...action.payload }, ...state];
    case DELETE_MATCH: {
      const matches = state.filter(match => match.matchID !== action.payload);
      return [...matches];
    }
    // HANDLE FETCH AND KICK
    default:
      return state;
  }
}
