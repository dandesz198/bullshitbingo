import React from 'react';
import { Text as RNText } from 'react-native';
import PropTypes from 'prop-types';

const Text = ({ isBold, style, children }) => (
  <RNText
    style={[
      {
        fontFamily: isBold ? 'CabinSketch-Bold' : 'CabinSketch-Regular',
      },
      style,
    ]}
  >
    {children}
  </RNText>
);

Text.propTypes = {
  isBold: PropTypes.bool,
  style: PropTypes.any,
  children: PropTypes.any,
};

Text.defaultProps = {
  isBold: false,
  style: {},
  children: {},
};

export { Text };
