import React from 'react';
import { Text as RNText } from 'react-native';
import PropTypes from 'prop-types';

const Text = ({ isBold, style }) => (
  <RNText
    style={[
      { fontFamily: isBold ? 'cabin-sketch-bold' : 'cabin-sketch' },
      style,
    ]}
  >
    {this.props.children}
  </RNText>
);

Text.propTypes = {
  isBold: PropTypes.bool,
  style: PropTypes.any,
};

Text.defaultProps = {
  isBold: false,
  style: {},
};

export { Text };
