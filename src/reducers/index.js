import { persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/es/storage';

import cards from './cards';
import error from './error';
import matches from './matches';
import rooms from './rooms';
import user from './user';

const config = {
  key: 'root',
  storage,
};

export default persistCombineReducers(config, {
  cards,
  error,
  matches,
  rooms,
  user,
});
