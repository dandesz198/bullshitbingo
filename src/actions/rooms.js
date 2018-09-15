import { Alert } from 'react-native';
import * as firebase from 'firebase';
import I18n from '../i18n';
import NavigationService from '../config/navigationService';
import { CREATE_ROOM, DELETE_ROOM, KICK } from './types';

// NEEDS TO BE REFACTORED - NTBR
/**
 * This action is dispacted when the user creates a room
 *
 * @param {object} roomPlain - The plain room object that contains the very basic data of the room
 */
export const createRoom = roomPlain => (dispatch, getState) => {
  const { name, masterPw, roomID } = roomPlain;
  const { myName, points } = getState().user;
  const room = {
    roomID,
    name,
    master: myName,
    masterPw,
    members: [myName],
  };

  firebase
    .database()
    .ref(`rooms/${roomID}`)
    .set({ ...room });

  room.members = [{ name: myName, points }];

  dispatch({
    type: CREATE_ROOM,
    payload: { ...room },
  });
};

// NEEDS TO BE REFACTORED - NTBR
/**
 * This action is dispacted when the user tries to join a room
 *
 * @param {string} roomID - The ID of the room the user is trying to join
 */
export const joinRoom = roomID => (dispatch, getState) => {
  const { myName } = getState().user;
  let room;

  firebase
    .database()
    .ref(`rooms/${roomID}/`)
    .once('value', async snap => {
      const value = snap.val();
      room = {
        name: value.name,
        master: value.master,
        masterPw: value.masterPw,
        members: Object.values(value.members),
        matches: value.matches ? Object.values(value.matches) : [],
        roomID: value.roomID,
      };

      if (room.members.indexOf(myName) < 0) {
        firebase
          .database()
          .ref(`rooms/${roomID}/members/`)
          .push(myName);
      }

      const members = [];

      await room.members.forEach(async element => {
        await firebase
          .database()
          .ref(`users/${element}/`)
          .once('value', snap => {
            members.push(snap.val());
          });
      });

      room.members = members;

      await dispatch({
        type: CREATE_ROOM,
        payload: { ...room },
      });

      // Navigate to the room
      NavigationService.navigateTo('Room', {
        roomID,
      });
    });
};

/**
 * This is a helper action dispatched when a room needs to be deleted only from the store
 *
 * @param {string} roomID - The ID of the room that needs to be deleted
 */
export const deleteRoom = roomID => ({
  type: DELETE_ROOM,
  payload: roomID,
});

/**
 * A helper action dispatched when the user gets kicked from a room
 * It navigates the user to the home to prevent crashing, notifies it about the kicking and deletes the room from the local store
 *
 * @param {string} roomID - The ID of the room that the user is kicked from
 */
export const kicked = roomID => dispatch => {
  NavigationService.popToTop();
  Alert.alert(I18n.t('kicked'), I18n.t('kicked_desc'));
  setTimeout(() => {
    dispatch(deleteRoom(roomID));
  }, 1250);
};

/**
 * This action is dispatched when a room needs to be deleted from both Firebase and the store
 *
 * @param {string} roomID - The ID of the room that needs to be deleted
 */
export const deleteRoomFromDb = roomID => dispatch => {
  firebase
    .database()
    .ref(`rooms/${roomID}`)
    .remove();

  dispatch(deleteRoom(roomID));
};

/**
 * This action is dispatched when the room master kicks someone
 *
 * @param {string} roomID - The ID of the room where the kicking is happening
 * @param {string} username - The name of the user that needs to be kicked
 */
export const kick = (roomID, username) => (dispatch, getState) => {
  const { rooms } = getState();
  const room = rooms.find(room => room.roomID === roomID);
  const members = room.members.map(member => member.name);

  members.splice(members.indexOf(username));

  firebase
    .database()
    .ref(`rooms/${roomID}`)
    .update({
      members,
    });

  dispatch({
    type: KICK,
  });
};

/**
 * This action is dispatched when the room master kicks someone
 *
 * @param {string} roomID - The ID of the room where the kicking is happening
 * @param {string} username - The name of the user that needs to be kicked
 */
export const quitRoom = roomID => (dispatch, getState) => {
  const { user, rooms } = getState();
  const { myName } = user;
  const room = rooms.find(room => room.roomID === roomID);
  const members = room.members.map(member => member.name);

  console.log('quitRoom - BEFORE - rooms', rooms);

  members.splice(members.indexOf(myName));

  firebase
    .database()
    .ref(`rooms/${roomID}`)
    .update({
      members,
    });

  rooms.splice(room);

  console.log('quitRoom - AFTER - rooms', rooms);

  dispatch(deleteRoom(roomID));
};

export default {};
