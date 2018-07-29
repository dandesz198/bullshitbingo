import { applyMiddleware, createStore } from 'redux';
import { persistStore } from 'redux-persist';
import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { composeWithDevTools } from 'redux-devtools-extension';
import {
  createReduxBoundAddListener,
  createReactNavigationReduxMiddleware,
} from 'react-navigation-redux-helpers';

import reducers from '../reducers';

const logger = createLogger();

const navMiddleware = createReactNavigationReduxMiddleware(
  'root',
  state => state.nav
);

export const addListener = createReduxBoundAddListener('root');

const multi = ({ dispatch }) => next => action =>
  Array.isArray(action) ? action.filter(Boolean).map(dispatch) : next(action);

const middleware = [navMiddleware, thunk, multi];
if (process.env.NODE_ENV === 'development') {
  middleware.push(logger);
}

export default () => {
  const store = createStore(
    reducers,
    composeWithDevTools(applyMiddleware(...middleware))
  );

  const persistor = persistStore(store);
  return { persistor, store };
};
