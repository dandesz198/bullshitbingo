import {
  CREATE_ROOM,
  DELETE_ROOM,
  CREATE_MATCH,
  DELETE_MATCH,
  CREATE_CARD,
  DELETE_CARD,
} from '../actions';

export default function reducer(state = [], action) {
  switch (action.type) {
    case CREATE_ROOM:
      return [...state, action.payload];
    case DELETE_ROOM: {
      const rooms = state.filter(room => room.roomID !== action.payload);
      return [...rooms];
    }
    /*
      FIXME: this is nowhere near optimal, it's a shitty hack. Remove this ASAP!

      TODO: create a flat store with ID's and 'normalizr',
      Then create the normal reducers for these action types

      Currently, the store is a multi-dimensional array, looking like this:
      {
        user: { ... },
        rooms: [
          {
            matches: [
              cards: [
                {
                  voters: [ '' ], ...
                }
              ], ...
            ], ...
          },
        ]
      }

      While the ultimate goal is this:

      {
        user: { ... },
        rooms: [ id -> room ],
        matches: [ id -> match ],
        cards: [ id -> card ],
        voters: [ id -> voter ]
      }
    */
    case (CREATE_MATCH, DELETE_MATCH, CREATE_CARD, DELETE_CARD): {
      return [action.payload];
    }
    default:
      return state;
  }
}
