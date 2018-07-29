import React from 'react';
import { Provider } from 'react-redux';
import { ActivityIndicator } from 'react-native';
import { PersistGate } from 'redux-persist/es/integration/react';
import configureStore from './src/config/setupStore';
import AppNavigator from './src/AppNavigator';

const { persistor, store } = configureStore();

const onBeforeLift = () => {
  // onBeforeLift actions
};

export default () => (
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
