import { persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/es/storage';

import user from './user';
import matches from './matches';

const config = {
  key: 'root',
  storage,
};

export default persistCombineReducers(config, {
  user,
  matches,
});
