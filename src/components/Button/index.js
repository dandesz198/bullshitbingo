import React from 'react';
import { TouchableOpacity, ImageBackground } from 'react-native';
import PropTypes from 'prop-types';
import { Text } from '@components';
import { Images } from '@assets';
import styles from './styles';

const Button = ({
  onPress,
  fontsLoaded,
  isDisabled,
  isFilled,
  isWide,
  isSmall,
  text,
  style,
}) => (
  <TouchableOpacity
    style={[styles.button, style]}
    disabled={isDisabled}
    onPress={onPress}
  >
    <ImageBackground
      source={
        isFilled ? Images.btn_filled : isWide ? Images.btn_wide : Images.btn
      }
      style={{
        width: isWide ? 330 : isSmall ? 84 : 140,
        height: isWide ? 64 : isSmall ? 35 : 58,
        justifyContent: 'center',
        opacity: isDisabled ? 0.5 : 1,
      }}
    >
      <Text
        isLoaded={fontsLoaded}
        isBold
        style={[
          styles.join,
          { color: isFilled ? 'white' : 'black', fontSize: isSmall ? 18 : 30 },
        ]}
      >
        {text}
      </Text>
    </ImageBackground>
  </TouchableOpacity>
);

Button.propTypes = {
  onPress: PropTypes.func,
  fontsLoaded: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isWide: PropTypes.bool,
  isSmall: PropTypes.bool,
  isFilled: PropTypes.bool,
  text: PropTypes.string,
  style: PropTypes.any,
};

Button.defaultProps = {
  onPress: () => {},
  fontsLoaded: false,
  isDisabled: false,
  isWide: false,
  isSmall: false,
  isFilled: false,
  text: '',
  style: {},
};

export { Button };
