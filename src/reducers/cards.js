import {
  CREATE_CARD,
  VOTE_CARD,
  UNVOTE_CARD,
  BINGO_CARD,
  DELETE_CARD,
  // FETCH, KICK
} from '../actions';

export default function reducer(state = [], action) {
  switch (action.type) {
    case CREATE_CARD:
      return [{ ...action.payload }, ...state];
    case DELETE_CARD: {
      const cards = state.filter(card => card !== action.payload);
      return [...cards];
    }
    case (VOTE_CARD, UNVOTE_CARD, BINGO_CARD): {
      return [...action.payload];
    }
    // HANDLE FETCH AND KICK
    default:
      return state;
  }
}
