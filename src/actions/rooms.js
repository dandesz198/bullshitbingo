import * as firebase from 'firebase';

import { CREATE_ROOM, DELETE_ROOM, CREATE_MATCH, CREATE_CARD } from './types';

export const createRoom = room => async (dispatch, getState) => {
  const { name, masterPw, roomID } = room;
  const { user } = getState();
  const { myName, points } = user;

  await firebase
    .database()
    .ref(`rooms/${roomID}`)
    .set({
      name,
      myName,
      masterPw,
      members: [{ myName, points }],
    });

  dispatch({
    type: CREATE_ROOM,
    payload: {
      name,
      myName,
      members: [{ myName, points }],
      roomID,
    },
  });
};

export const joinRoom = roomID => async (dispatch, getState) => {
  const { myName } = getState().user;

  await firebase
    .database()
    .ref(`rooms/${roomID}/`)
    .once('value', snap => {
      const { members, master } = Object.values(snap.val());
      if (members.indexOf(myName) === -1) {
        firebase
          .database()
          .ref(`rooms/${roomID}/members/`)
          .push(myName);
      }

      dispatch({
        type: CREATE_ROOM,
        payload: {
          name,
          master,
          members,
          roomID,
        },
      });
    });
};

export const deleteRoom = roomID => async dispatch => {
  dispatch({
    type: DELETE_ROOM,
    payload: roomID,
  });
};

export const checkRoom = roomID => async getState => {
  const { myName } = getState().user;

  firebase
    .database()
    .ref(`rooms/${roomID}/members/`)
    .once('value')
    .then(snap => {
      if (snap.val()) {
        const members = Object.values(snap.val());
        // If member even exists
        if (members) {
          // If room doesn't exist or player is kicked
          if (members.length < 0 || members.indexOf(myName) === -1) {
            deleteRoom(roomID);
          }
        } else {
          deleteRoom(roomID);
        }
      } else {
        deleteRoom(roomID);
      }
    });
};

export const createMatch = (roomID, match) => async (dispatch, getState) => {
  const { rooms } = getState();
  const room = rooms.find(room => room.roomID === roomID);

  if (!room.matches) {
    room.matches = [match];
  } else {
    room.matches.unshift(match);
  }

  firebase
    .database()
    .ref(`rooms/${roomID}/`)
    .update({
      matches: room.matches,
    });

  dispatch({
    type: CREATE_MATCH,
    payload: { rooms },
  });
};

export const createCard = (roomID, matchID, card) => async (
  dispatch,
  getState
) => {
  const { rooms } = getState();
  const room = rooms.find(room => room.roomID === roomID);
  const match = room.matches.find(match => match.matchID === matchID);

  if (!match.cards) {
    match.cards = [card];
  } else {
    match.cards.unshift(card);
  }

  firebase
    .database()
    .ref(`rooms/${roomID}/matches/${matchID}`)
    .update({
      cards: match.cards,
    });

  dispatch({
    type: CREATE_CARD,
    payload: { rooms },
  });
};

export default {};
