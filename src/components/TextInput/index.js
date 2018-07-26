import React from 'react';
import { TextInput as RNTextInput } from 'react-native';
import PropTypes from 'prop-types';
import styles from './styles';

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
