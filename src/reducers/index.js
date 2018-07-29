import { persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/es/storage';

import nav from './nav';
import rooms from './rooms';
import user from './user';

const config = {
  key: 'root',
  storage,
};

export default persistCombineReducers(config, {
  nav,
  rooms,
  user,
});
