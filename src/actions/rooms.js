import * as firebase from 'firebase';

import { FETCH, CREATE_ROOM, DELETE_ROOM, KICK } from './types';

export const createRoom = roomPlain => (dispatch, getState) => {
  const { name, masterPw, roomID } = roomPlain;
  const { user } = getState();
  const { myName, points } = user;
  const room = {
    roomID,
    name,
    master: myName,
    masterPw,
    members: [{ name: myName, points }],
  };

  firebase
    .database()
    .ref(`rooms/${roomID}`)
    .set({ ...room });

  dispatch({
    type: CREATE_ROOM,
    payload: { ...room },
  });
};

// CHECK NEEDED
export const joinRoom = roomID => (dispatch, getState) => {
  const { myName } = getState().user;

  firebase
    .database()
    .ref(`rooms/${roomID}/`)
    .once('value', snap => {
      const room = Object.values(snap.val());
      if (room.members.indexOf(myName) === -1) {
        firebase
          .database()
          .ref(`rooms/${roomID}/members/`)
          .push(myName);
      }

      dispatch({
        type: CREATE_ROOM,
        payload: { ...room },
      });
    });
};

const deleteRoom = roomID => ({
  type: DELETE_ROOM,
  payload: roomID,
});

export const deleteRoomDispatcher = roomID => dispatch =>
  dispatch(deleteRoom(roomID));

export const deleteRoomFromDb = roomID => dispatch => {
  console.log('deleteRoomFromDb ran');

  firebase
    .database()
    .ref(`rooms/${roomID}`)
    .remove();

  dispatch(deleteRoom(roomID));
};

// CHECK NEEDED
export const kick = (roomID, username) => async (getState, dispatch) => {
  const { rooms } = getState();
  const room = rooms.find(room => room.roomID === roomID);
  const index = rooms.indexOf(room);

  room.members.splice(room.members.indexOf(username), 1);
  firebase
    .database()
    .ref(`rooms/${roomID}`)
    .update({
      members: room.members,
    });

  rooms[index] = room;

  dispatch({
    type: KICK,
    payload: [...rooms],
  });
};

// CHECK NEEDED
export const quitRoom = roomID => (dispatch, getState) => {
  const { user, rooms } = getState();
  const { myName } = user;
  const room = rooms.find(room => room.roomID === roomID);

  console.log('quitRoom - BEFORE - rooms', rooms);

  room.members.splice(room.members.indexOf(myName));

  firebase
    .database()
    .ref(`rooms/${roomID}`)
    .update({
      members: room.members,
    });

  rooms.splice(room);

  console.log('quitRoom - AFTER - rooms', rooms);

  dispatch(deleteRoom(roomID));
};

// CHECK NEEDED
export const fetchFromDb = roomID => async (dispatch, getState) => {
  const { rooms, user } = getState();
  const { myName } = user;
  const room = rooms.find(room => room.roomID === roomID);
  let roomFromDb;

  await firebase
    .database()
    .ref(`rooms/${roomID}/`)
    .on('value', snap => {
      roomFromDb = snap.val();

      if (roomFromDb) {
        const members = Object.values(snap.val());
        // If member even exists
        if (members) {
          // If room doesn't exist or player is kicked
          if (members.length < 0 || members.indexOf(myName) === -1) {
            dispatch(deleteRoom(roomID));
          }
        } else {
          dispatch(deleteRoom(roomID));
        }
      } else {
        dispatch(deleteRoom(roomID));
      }
    });

  rooms[rooms.indexOf(room)] = Object.assign(room, roomFromDb);

  dispatch({
    type: FETCH,
    payload: [...rooms],
  });
};

export default {};
