import {
  FETCH,
  CREATE_CARD,
  VOTE_CARD,
  UNVOTE_CARD,
  BINGO_CARD,
  DELETE_CARD,
  FETCH_CARDS,
} from '../actions';

export default function reducer(state = [], action) {
  switch (action.type) {
    case FETCH:
      return [];
    case FETCH_CARDS:
      return [...action.payload, ...state];
    case CREATE_CARD:
      return [action.payload, ...state];
    case DELETE_CARD: {
      const cards = state.filter(card => card.cardID !== action.payload);
      return [...cards];
    }
    case (VOTE_CARD, UNVOTE_CARD): {
      return state;
    }
    case BINGO_CARD: {
      const cards = state.map(item => {
        const card = item;
        if (card.cardID === action.payload) {
          card.isBingo = true;
        }
        return card;
      });
      return cards;
    }
    default:
      return state;
  }
}
