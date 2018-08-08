import * as firebase from 'firebase';

import {
  CREATE_CARD,
  DELETE_CARD,
  VOTE_CARD,
  UNVOTE_CARD,
  BINGO_CARD,
  ERROR,
} from './types';

export const createCard = (roomID, matchID, card) => (dispatch, getState) => {
  const { cards } = getState();
  let filteredCards = cards.filter(card => card.matchID === matchID);

  if (!filteredCards) {
    filteredCards = [card];
  } else {
    filteredCards.unshift(card);
  }

  firebase
    .database()
    .ref(`rooms/${roomID}/matches/${matchID}`)
    .update({
      cards: filteredCards,
    });

  dispatch({
    type: CREATE_CARD,
    payload: { ...card },
  });
};

// CHECK NEEDED
export const deleteCard = (roomID, matchID, card) => (dispatch, getState) => {
  const { rooms } = getState();
  const room = rooms.find(room => room.roomID === roomID);
  const { cards } = room.matches.find(match => match.matchID === matchID);
  const index = rooms.indexOf(room);

  cards.splice(cards.indexOf(card), 1);

  firebase
    .database()
    .ref(`rooms/${roomID}/matches/${matchID}`)
    .update({
      cards,
    });

  rooms[index] = room;

  dispatch({
    type: DELETE_CARD,
    payload: [...rooms],
  });
};

export const vote = (roomID, matchID, cardID) => (dispatch, getState) => {
  const { cards, user } = getState();
  const { myName } = user;
  const cardToModify = cards.find(
    cardFromState => cardFromState.cardID === cardID
  );

  cardToModify.voters.push(myName);

  firebase
    .database()
    .ref(`rooms/${roomID}/matches/${matchID}`)
    .update({
      cards: [cardToModify, ...cards],
    });

  dispatch({
    type: VOTE_CARD,
    payload: { cardToModify },
  });
};

export const unvote = (roomID, matchID, cardID) => (dispatch, getState) => {
  const { cards, user } = getState();
  const { myName } = user;
  const cardToModify = cards.find(
    cardFromState => cardFromState.cardID === cardID
  );

  cardToModify.voters.splice(cardToModify.indexOf(myName));

  firebase
    .database()
    .ref(`rooms/${roomID}/matches/${matchID}`)
    .update({
      cards: [cardToModify, ...cards],
    });

  dispatch({
    type: UNVOTE_CARD,
    payload: { cardToModify },
  });
};

// CHECK NEEDED
export const bingo = (roomID, matchID, card) => (dispatch, getState) => {
  const { rooms, user } = getState();
  const { myName } = user;
  const room = rooms.find(room => room.roomID === roomID);
  const { cards } = room.matches.find(match => match.matchID === matchID);
  const cardToModify = cards.find(cardFromState => cardFromState === card);
  const index = rooms.indexOf(room);

  cardToModify.isBingo = true;

  console.log('action - vote - cards', cards);

  firebase
    .database()
    .ref(`rooms/${roomID}/matches/${matchID}`)
    .update({
      cards,
    });

  rooms[index] = room;

  if (card.voters.length === 1 && card.voters[0] === myName) {
    dispatch({
      type: ERROR,
      payload: { title: 'error', details: 'one_voter' },
    });
    return;
  }

  if (card.voters.length <= 0) {
    return;
  }

  card.voters.forEach(element => {
    firebase
      .database()
      .ref(`users/${element}/points`)
      .once('value')
      .then(snap => {
        firebase
          .database()
          .ref(`users/${element}/`)
          .update({
            points: snap.val() + 1,
          });
      });
  });

  dispatch({
    type: BINGO_CARD,
    payload: [...rooms],
  });
};

export default {};
