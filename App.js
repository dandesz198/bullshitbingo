import React, { Component } from 'react';
import { Alert, BackHandler } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/es/integration/react';
import * as firebase from 'firebase';
import PropTypes from 'prop-types';

import configureStore from './src/config/setupStore';
import NavigationService from './src/config/navigationService';
import Routes from './src/Routes';
import I18n from './src/i18n';

const Environment = require('./src/config/environment');

const { persistor, store } = configureStore();

const onBeforeLift = () => {
  // onBeforeLift actions
};

export default class App extends Component {
  static propTypes = {
    deleteRoom: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired,
  };

  componentDidMount = async () => {
    firebase.initializeApp({ ...Environment });
    const { deleteRoom, user } = this.props;
    const { myName } = user;

    // Add the user kicker listener
    firebase
      .database()
      .ref(`users/${myName}/rooms`)
      .on('child_removed', async snap => {
        deleteRoom(snap().val);
        NavigationService.navigateTo('Home');
        Alert.alert(I18n.t('kicked'), I18n.t('kicked_desc'));
      });

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
