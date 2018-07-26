import React from 'react';
import { Text as RNText } from 'react-native';
import PropTypes from 'prop-types';

const Text = ({ isBold, isLoaded, style, children }) => (
  <RNText
    style={[
      {
        fontFamily: isLoaded
          ? isBold
            ? 'cabin-sketch-bold'
            : 'cabin-sketch'
          : null,
      },
      style,
    ]}
  >
    {children}
  </RNText>
);

Text.propTypes = {
  isBold: PropTypes.bool,
  isLoaded: PropTypes.bool,
  style: PropTypes.any,
  children: PropTypes.any,
};

Text.defaultProps = {
  isBold: false,
  isLoaded: true,
  style: {},
  children: {},
};

export { Text };
