import React from 'react';
import { Text as RNText } from 'react-native';
import PropTypes from 'prop-types';

/**
 * This is a modified text component that uses the CabinSketch font
 *
 * @param {string} isBold - Defines if the text needs to be displayed with a bold font or not
 * @param {object} style - The style object that overrides the basic style of the component
 * @param {object} children - The text that is displayed
 */
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
