import * as firebase from 'firebase';
import { asyncForEach } from '../services';
import { kicked } from './rooms';

import { FETCH, FETCH_ROOMS, FETCH_MATCHES, FETCH_CARDS } from './types';

// NEEDS TO BE REFACTORED - NTBR
/**
 * This action is dispacted for every room the user is in
 * It grabs the data from Firebase and converts it to the Redux store
 *
 * @param {string} roomID - The ID of the room
 */
export const fetchFromDb = roomID => async (dispatch, getState) => {
  const { rooms, user } = getState();
  const { myName } = user;
  const room = rooms.find(room => room.roomID === roomID);
  let roomFromDb;

  await firebase
    .database()
    .ref(`rooms/${roomID}/`)
    .on('value', async snap => {
      const value = snap.val();
      const fetchedMembers = [];

      roomFromDb = {
        name: value.name,
        master: value.master,
        masterPw: value.masterPw,
        members: Object.values(value.members),
        matches: value.matches ? Object.values(value.matches) : [],
        roomID: value.roomID,
      };

      if (roomFromDb) {
        const members = Object.values(snap.val().members);
        // If member even exists
        if (members) {
          // If room doesn't exist or player is kicked
          if (members.length < 0 || members.indexOf(myName) === -1) {
            dispatch(kicked(roomID));
          } else {
            // Get data for every player in room
            await asyncForEach(roomFromDb.members, async element => {
              await firebase
                .database()
                .ref(`users/${element}/`)
                .once('value', snap => {
                  fetchedMembers.push(snap.val());
                  room.members = fetchedMembers;
                  roomFromDb.members = fetchedMembers;
                });
            });

            rooms[rooms.indexOf(room)] = Object.assign(room, roomFromDb);

            dispatch({
              type: FETCH,
            });

            const cards = [];

            await asyncForEach(roomFromDb.matches, async match => {
              await asyncForEach(match.cards, async card => {
                const { cardID, matchID, text, creator, isBingo } = card;
                cards.push({
                  cardID,
                  matchID,
                  text,
                  creator,
                  isBingo,
                  voters: card.voters ? Object.values(card.voters) : [],
                });
              });
              match.cards = undefined;
            });

            dispatch({
              type: FETCH_CARDS,
              payload: [...cards],
            });

            dispatch({
              type: FETCH_MATCHES,
              payload: [...roomFromDb.matches],
            });

            room.matches = undefined;

            dispatch({
              type: FETCH_ROOMS,
              payload: [...rooms],
            });
          }
        } else {
          dispatch(kicked(roomID));
        }
      }
    });
};

export default {};
