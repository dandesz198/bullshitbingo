import React, { Component } from 'react';
import { View, BackHandler, Alert } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as firebase from 'firebase';

import Routes from './Routes';
import { navigateTo, navigateBack, deleteRoom } from './actions';
import { addListener } from './config/setupStore';
import I18n from './i18n';

class AppNavigation extends Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    nav: PropTypes.object.isRequired,
    navigateBack: PropTypes.func.isRequired,
    navigateTo: PropTypes.func.isRequired,
    deleteRoom: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired,
  };

  componentDidMount = async () => {
    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
  };

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
  }

  onBackPress = () => {
    const { navigateBack } = this.props;
    navigateBack();
    return true;
  };

  render() {
    const { dispatch, nav, navigateTo, deleteRoom, user } = this.props;
    const { myName } = user;

    // Add the user kicker listener
    firebase
      .database()
      .ref(`users/${myName}/rooms`)
      .on('child_removed', async snap => {
        deleteRoom(snap().val);
        navigateTo('Home');
        Alert.alert(I18n.t('kicked'), I18n.t('kicked_desc'));
      });

    return (
      <View style={{ flex: 1 }}>
        <Routes
          navigation={{
            dispatch,
            state: nav,
            addListener,
          }}
        />
      </View>
    );
  }
}

const mapStateToProps = ({ nav, user }) => ({
  nav,
  user,
});

export default connect(
  mapStateToProps,
  {
    navigateBack,
    navigateTo,
    deleteRoom,
  }
)(AppNavigation);
