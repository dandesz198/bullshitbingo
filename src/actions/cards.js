import * as firebase from 'firebase';

import {
  CREATE_CARD,
  DELETE_CARD,
  VOTE_CARD,
  UNVOTE_CARD,
  BINGO_CARD,
  ERROR,
} from './types';

export const createCard = (roomID, matchID, card) => async (
  dispatch,
  getState
) => {
  const { rooms } = getState();
  const room = rooms.find(room => room.roomID === roomID);
  let { cards } = room.matches.find(match => match.matchID === matchID);

  if (!cards) {
    cards = [card];
  } else {
    cards.unshift(card);
  }

  firebase
    .database()
    .ref(`rooms/${roomID}/matches/${matchID}`)
    .update({
      cards,
    });

  dispatch({
    type: CREATE_CARD,
    payload: { rooms },
  });
};

export const deleteCard = (roomID, matchID, card) => async (
  dispatch,
  getState
) => {
  const { rooms } = getState();
  const room = rooms.find(room => room.roomID === roomID);
  const { cards } = room.matches.find(match => match.matchID === matchID);

  cards.splice(cards.indexOf(card), 1);

  firebase
    .database()
    .ref(`rooms/${roomID}/matches/${matchID}`)
    .update({
      cards,
    });

  dispatch({
    type: DELETE_CARD,
    payload: { rooms },
  });
};

export const vote = (roomID, matchID, card) => async (dispatch, getState) => {
  const { rooms, user } = getState();
  const { myName } = user;
  const room = rooms.find(room => room.roomID === roomID);
  const { cards } = room.matches.find(match => match.matchID === matchID);
  const cardToModify = cards.find(cardFromState => cardFromState === card);

  cardToModify.voters.push(myName);

  console.log('action - vote - cards', cards);

  firebase
    .database()
    .ref(`rooms/${roomID}/matches/${matchID}`)
    .update({
      cards,
    });

  dispatch({
    type: VOTE_CARD,
    payload: { rooms },
  });
};

export const unvote = (roomID, matchID, card) => async (dispatch, getState) => {
  const { rooms, user } = getState();
  const { myName } = user;
  const room = rooms.find(room => room.roomID === roomID);
  const { cards } = room.matches.find(match => match.matchID === matchID);
  const cardToModify = cards.find(cardFromState => cardFromState === card);

  card.voters.splice(cardToModify.voters.indexOf(myName), 1);
  cards[cards.indexOf(card)] = cardToModify;

  console.log('action - unvote - cards', cards);

  firebase
    .database()
    .ref(`rooms/${roomID}/matches/${matchID}`)
    .update({
      cards,
    });

  dispatch({
    type: UNVOTE_CARD,
    payload: { rooms },
  });
};

export const bingo = (roomID, matchID, card) => async (dispatch, getState) => {
  const { rooms, user } = getState();
  const { myName } = user;
  const room = rooms.find(room => room.roomID === roomID);
  const { cards } = room.matches.find(match => match.matchID === matchID);
  const cardToModify = cards.find(cardFromState => cardFromState === card);

  cardToModify.isBingo = true;

  console.log('action - vote - cards', cards);

  firebase
    .database()
    .ref(`rooms/${roomID}/matches/${matchID}`)
    .update({
      cards,
    });

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
    payload: { rooms },
  });
};

export default {};
