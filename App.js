import React, { Component } from 'react';
import { BackHandler } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/es/integration/react';
import * as firebase from 'firebase';

import configureStore from './src/config/setupStore';
import NavigationService from './src/config/navigationService';
import Routes from './src/Routes';

const Environment = require('./src/config/environment');

const { persistor, store } = configureStore();

const onBeforeLift = () => {
  // onBeforeLift actions
};

export default class App extends Component {
  componentDidMount = async () => {
    firebase.initializeApp({ ...Environment });
    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
  };

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
  }

  onBackPress = () => {
    NavigationService.navigateBack();
    return true;
  };

  render() {
    return (
      <Provider store={store}>
        <PersistGate onBeforeLift={onBeforeLift} persistor={persistor}>
          <Routes
            ref={navigatorRef => {
              NavigationService.setTopLevelNavigator(navigatorRef);
            }}
          />
        </PersistGate>
      </Provider>
    );
  }
}
