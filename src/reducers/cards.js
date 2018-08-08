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
      return [action.payload, ...state];
    case DELETE_CARD: {
      const cards = state.filter(card => card !== action.payload);
      return [...cards];
    }
    case VOTE_CARD: {
      const cards = state.map(card => {
        if (card.cardID === action.payload.cardID) {
          card.voters.push(action.payload.myName);
        }
        return card;
      });
      return cards;
    }
    case UNVOTE_CARD: {
      const cards = state.map(card => {
        if (card.cardID === action.payload.cardID) {
          card.voters.splice(card.voters.indexOf(action.payload.myName));
        }
        return card;
      });
      return cards;
    }
    case BINGO_CARD: {
      const cards = state.map(card => {
        if (card.cardID === action.payload) {
          card.isBingo = true;
        }
        return card;
      });
      return cards;
    }
    // HANDLE FETCH AND KICK
    default:
      return state;
  }
}
