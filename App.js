import React from 'react';
import { Provider } from 'react-redux';
import { ActivityIndicator } from 'react-native';
import { PersistGate } from 'redux-persist/es/integration/react';
import * as firebase from 'firebase';
import configureStore from './src/config/setupStore';
import AppNavigator from './src/AppNavigator';

const Environment = require('./src/config/environment');

const { persistor, store } = configureStore();

const onBeforeLift = () => {
  // onBeforeLift actions
};

export default () => {
  firebase.initializeApp({ ...Environment });
  return (
    <Provider store={store}>
      <PersistGate
        loading={<ActivityIndicator />}
        onBeforeLift={onBeforeLift}
        persistor={persistor}
      >
        <AppNavigator />
      </PersistGate>
    </Provider>
  );
};
