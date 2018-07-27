import React from 'react';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import axios from 'axios';
import axiosMiddleware from 'redux-axios-middleware';

import reducer from './src/reducer';
import AppNavigator from './src/AppNavigator';

const client = axios.create({
  baseURL: 'https://api.github.com',
  responseType: 'json',
});

const store = createStore(reducer, applyMiddleware(axiosMiddleware(client)));

export default () => (
  <Provider store={store}>
    <AppNavigator />
  </Provider>
);
