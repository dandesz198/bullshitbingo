import React from 'react';
import { TouchableOpacity, ImageBackground } from 'react-native';
import PropTypes from 'prop-types';
import { Text } from '@components';
import { Images } from '@assets';
import styles from './styles';

// NEEDS TO BE REFACTORED - NTBR
/**
 * This is button component with the basic background
 *
 * @param {func} onPress - The action that runs when the button is pressed
 * @param {bool} isDisabled - Defines if the button is touchable/disabled
 * @param {bool} isFilled - Defines if the button background is filled (used at BINGO-ed buttons)
 * @param {bool} isWide - Defines if the button is a wide button
 * @param {bool} isSmall - Defines if the button is a small/short button
 * @param {string} text - The text that is displayed on the button
 * @param {object} style - A style object that overrides the button's basic style
 */
const Button = ({
  onPress,
  isDisabled,
  isFilled,
  isWide,
  isSmall,
  text,
  style,
}) => {
  const width = isWide ? 330 : isSmall ? 84 : 140;
  const height = isWide ? 64 : isSmall ? 35 : 58;
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      disabled={isDisabled}
      onPress={onPress}
    >
      <ImageBackground
        source={
          isFilled ? Images.btn_filled : isWide ? Images.btn_wide : Images.btn
        }
        style={{
          width,
          height,
          justifyContent: 'center',
          opacity: isDisabled ? 0.5 : 1,
        }}
      >
        <Text
          isBold
          style={[
            styles.text,
            {
              color: isFilled ? 'white' : 'black',
              fontSize: isWide ? 26 : isSmall ? 16 : 20,
              textAlign: 'center',
            },
          ]}
          numberOfLines={1}
        >
          {text}
        </Text>
      </ImageBackground>
    </TouchableOpacity>
  );
};

Button.propTypes = {
  onPress: PropTypes.func,
  isDisabled: PropTypes.bool,
  isWide: PropTypes.bool,
  isSmall: PropTypes.bool,
  isFilled: PropTypes.bool,
  text: PropTypes.string,
  style: PropTypes.any,
};

Button.defaultProps = {
  onPress: () => {},
  isDisabled: false,
  isWide: false,
  isSmall: false,
  isFilled: false,
  text: '',
  style: {},
};

export { Button };
