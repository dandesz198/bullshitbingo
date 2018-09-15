import * as firebase from 'firebase';

import {
  CREATE_CARD,
  DELETE_CARD,
  VOTE_CARD,
  UNVOTE_CARD,
  BINGO_CARD,
  ERROR,
} from './types';

/**
 * This action is dispacted when a new card needs to be created in a match
 *
 * @param {string} roomID - The ID of the room
 * @param {string} matchID - The ID of the match
 * @param {object} card - The card object that's created. The data of it isn't processed.
 */

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

/**
 * This action is dispacted when a card needs to be deleted from a match
 *
 * @param {string} roomID - The ID of the room
 * @param {string} matchID - The ID of the match
 * @param {object} card - The card object that's going to get deleted.
 */
export const deleteCard = (roomID, matchID, card) => (dispatch, getState) => {
  const { cards } = getState();
  const filteredCards = cards.filter(card => card.matchID === matchID);

  filteredCards.splice(filteredCards.indexOf(card), 1);

  firebase
    .database()
    .ref(`rooms/${roomID}/matches/${matchID}`)
    .update({
      cards: filteredCards,
    });

  dispatch({
    type: DELETE_CARD,
    payload: card.cardID,
  });
};

/**
 * This action is dispacted when the user votes on a card
 *
 * @param {string} roomID - The ID of the room
 * @param {string} matchID - The ID of the match
 * @param {object} cardID - The ID of the card that needs to get voted
 */
export const vote = (roomID, matchID, cardID) => (dispatch, getState) => {
  const { cards, user } = getState();
  const { myName } = user;
  const matchCards = cards.filter(card => card.matchID === matchID);
  const card = matchCards.find(card => card.cardID === cardID);
  const index = matchCards.indexOf(card);

  card.voters.push(myName);

  firebase
    .database()
    .ref(`rooms/${roomID}/matches/${matchID}/cards/${index}`)
    .update({
      ...card,
    });

  dispatch({
    type: VOTE_CARD,
  });
};

/**
 * This action is dispacted when the user removes a vote from a card
 *
 * @param {string} roomID - The ID of the room
 * @param {string} matchID - The ID of the match
 * @param {object} cardID - The ID of the card that needs to get unvoted
 */
export const unvote = (roomID, matchID, cardID) => (dispatch, getState) => {
  const { cards, user } = getState();
  const { myName } = user;
  const matchCards = cards.filter(card => card.matchID === matchID);
  const card = matchCards.find(card => card.cardID === cardID);
  const index = matchCards.indexOf(card);

  card.voters = card.voters.filter(name => name !== myName);

  firebase
    .database()
    .ref(`rooms/${roomID}/matches/${matchID}/cards/${index}`)
    .update({
      ...card,
    });

  dispatch({
    type: UNVOTE_CARD,
  });
};

// NEEDS TO BE REFACTORED - NTBR
/**
 * This action is dispacted when the room/match-master announces that a card is bingo
 * It gives points to every voter and makes the card unvoteable
 *
 * @param {string} roomID - The ID of the room
 * @param {string} matchID - The ID of the match
 * @param {object} cardID - The ID of the card that needs to get bingoed
 */
export const bingo = (roomID, matchID, card) => (dispatch, getState) => {
  const { cards, user } = getState();
  const { myName } = user;
  const cardToModify = cards.find(
    cardFromState => cardFromState.cardID === card.cardID
  );

  cardToModify.isBingo = true;

  firebase
    .database()
    .ref(`rooms/${roomID}/matches/${matchID}`)
    .update({
      cards: [cardToModify, ...cards],
    });

  if (card.voters.length === 1 && card.voters === [myName]) {
    dispatch({
      type: ERROR,
      payload: { title: 'error', details: 'one_voter' },
    });
    return;
  }

  dispatch({
    type: BINGO_CARD,
    payload: card.cardID,
  });

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
};

export default {};
