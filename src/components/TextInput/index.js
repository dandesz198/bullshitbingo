import React from 'react';
import { TextInput as RNTextInput } from 'react-native';
import PropTypes from 'prop-types';
import styles from './styles';

/**
 * This is a modified TextInput component that uses the CabinSketch font and the custom styling
 *
 * @param {string} value - The value of the input
 * @param {object} style - The style object that overrides the basic style of the component
 * @param {string} placeholder - The placeholder text for the input
 * @param {string} keyboardType - The type of the keyboard (e.g. default or PIN)
 * @param {func} onChangeText - The function that runs when the text is changed
 * @param {bool} secureTextEntry - Defines if the field is a password field or not
 */
const TextInput = ({
  value,
  style,
  placeholder,
  keyboardType,
  onChangeText,
  secureTextEntry,
}) => (
  <RNTextInput
    style={[
      styles.input,
      style,
      {
        fontFamily: 'CabinSketch-Bold',
      },
    ]}
    underlineColorAndroid="transparent"
    placeholder={placeholder}
    placeholderTextColor="#444"
    keyboardType={keyboardType}
    secureTextEntry={secureTextEntry}
    onChangeText={value => onChangeText(value)}
    value={value}
  />
);

TextInput.propTypes = {
  value: PropTypes.string,
  style: PropTypes.any,
  placeholder: PropTypes.string,
  keyboardType: PropTypes.string,
  onChangeText: PropTypes.func,
  secureTextEntry: PropTypes.bool,
};

TextInput.defaultProps = {
  value: '',
  style: {},
  placeholder: '',
  keyboardType: 'default',
  onChangeText: () => {},
  secureTextEntry: false,
};

export { TextInput };
