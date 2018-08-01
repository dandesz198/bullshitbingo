import { persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/es/storage';

import error from './error';
import rooms from './rooms';
import user from './user';

const config = {
  key: 'root',
  storage,
};

export default persistCombineReducers(config, {
  error,
  rooms,
  user,
});
