import React, { Component } from 'react';
import { View, BackHandler } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Routes from './Routes';
import { navigateBack } from './actions';
import { addListener } from './config/setupStore';

class AppNavigation extends Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    nav: PropTypes.object.isRequired,
    navigateBack: PropTypes.func.isRequired,
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
    const { dispatch, nav } = this.props;
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

const mapStateToProps = ({ nav }) => ({
  nav,
});

const mapDispatchToProps = dispatch => ({
  dispatch,
  navigateBack: () => dispatch(navigateBack()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AppNavigation);
