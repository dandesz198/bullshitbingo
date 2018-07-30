import { persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/es/storage';

import rooms from './rooms';
import user from './user';

const config = {
  key: 'root',
  storage,
};

export default persistCombineReducers(config, {
  rooms,
  user,
});
