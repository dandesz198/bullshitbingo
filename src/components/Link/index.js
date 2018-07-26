import React from 'react';
import { Text, TouchableOpacity, Linking, Dimensions } from 'react-native';
import PropTypes from 'prop-types';
import styles from './styles';

const Link = ({ text, url }) => (
  <TouchableOpacity
    style={{ height: 20, width: Dimensions.get('window').width * (60 / 100) }}
    onPress={() => {
      Linking.openURL(url);
    }}
  >
    <Text style={styles.link}>{text}</Text>
  </TouchableOpacity>
);

Link.propTypes = {
  text: PropTypes.string,
  url: PropTypes.string,
};

Link.defaultProps = {
  text: '',
  url: '',
};

export { Link };
