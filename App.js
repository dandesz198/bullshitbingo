import React from 'react';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import axios from 'axios';
import axiosMiddleware from 'redux-axios-middleware';
import thunk from 'redux-thunk';

import reducer from './src/reducers';
import AppNavigator from './src/AppNavigator';

const client = axios.create({
  baseURL: 'https://api.github.com',
  responseType: 'json',
});

const middlewares = [thunk, axiosMiddleware(client)];

const store = createStore(reducer, applyMiddleware(...middlewares));

export default () => (
  <Provider store={store}>
    <AppNavigator />
  </Provider>
);
