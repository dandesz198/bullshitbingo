import React, { Component } from 'react';
import { BackHandler, View } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Routes from './Routes';
import { navigateTo, navigateBack } from './actions';

class AppNavigation extends Component {
  static propTypes = {
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
    return (
      <View style={{ flex: 1 }}>
        <Routes />
      </View>
    );
  }
}

// const mapStateToProps = () => {};

const mapDispatchToProps = dispatch => ({
  dispatch,
  navigateTo: (route, params) => dispatch(navigateTo(route, params)),
  navigateBack: () => dispatch(navigateBack()),
});

export default connect(
  null,
  mapDispatchToProps
)(AppNavigation);
