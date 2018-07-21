import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Analytics, Event } from 'expo-analytics';
import PropTypes from 'prop-types';
import styles from './styles';
import Images from '@assets';
import I18n from '../../i18n';

const Environment = require('../../config/environment');

const analytics = new Analytics(Environment.analytics);

const Card = ({
  matchName,
  creatorName,
  cardText,
  isMaster,
  isMatch,
  isBingo,
  onVotePress,
  onDeletePress,
  onBingoPress,
  voted,
  voteCount,
}) => (
  <ImageBackground
    resizeMode="stretch"
    source={Images.card}
    style={{
      width: Dimensions.get('window').width * (95 / 100),
      minHeight: 100,
      marginLeft: 'auto',
      marginRight: 'auto',
      padding: 20,
      marginTop: 20,
    }}
  >
    <View style={styles.textBoxStyle}>
      <View style={{ flexDirection: 'row', height: 20 }}>
        <Text
          numberOfLines={1}
          style={[
            styles.roomNameText,
            { maxWidth: Dimensions.get('window').width * (50 / 100) },
          ]}
        >
          {matchName}
        </Text>
        <Text
          style={[styles.roomNameText, { marginRight: 0, marginLeft: 'auto' }]}
        >
          {creatorName}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text
          style={[
            styles.nameText,
            { width: Dimensions.get('window').width * (75 / 100) },
          ]}
        >
          {cardText}
        </Text>
        <TouchableOpacity
          style={{
            marginRight: 0,
            marginLeft: 'auto',
            display: isMaster && !isMatch ? 'flex' : 'none',
          }}
          onPress={() => {
            onDeletePress();
            analytics.event(
              new Event(isMatch ? 'Delete match' : 'Delete card')
            );
          }}
        >
          <Image
            source={Images.trash}
            style={{ height: 30, width: 21, marginVertical: 'auto' }}
          />
        </TouchableOpacity>
      </View>
    </View>
    <View style={styles.buttonBoxStyle}>
      <TouchableOpacity
        style={[
          styles.buttonStyle,
          {
            marginRight: 10,
            borderRadius: 5,
            display: isBingo ? 'none' : 'flex',
          },
        ]}
        onPress={() => {
          onVotePress();
        }}
      >
        <ImageBackground
          source={!isMatch && voted ? Images.btn_filled : Images.btn}
          style={{ width: 84, height: 35, justifyContent: 'center' }}
        >
          <Text
            style={{
              fontSize: 18,
              textAlign: 'center',
              fontFamily: 'cabin-sketch-bold',
              color: !isMatch && voted ? 'white' : 'black',
            }}
          >
            {isMatch ? I18n.t('join') : I18n.t('vote')}
          </Text>
        </ImageBackground>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.buttonStyle,
          {
            display: isMaster ? 'flex' : isBingo ? 'flex' : 'none',
          },
        ]}
        onPress={() => {
          onBingoPress();
        }}
      >
        <ImageBackground
          source={!isMatch && isBingo ? Images.btn_filled : Images.btn}
          style={{ width: 84, height: 35, justifyContent: 'center' }}
        >
          <Text
            style={{
              fontSize: 18,
              textAlign: 'center',
              fontFamily: 'cabin-sketch-bold',
              color: !isMatch && isBingo ? 'white' : 'black',
            }}
          >
            {isMatch ? I18n.t('delete') : I18n.t('bingo')}
          </Text>
        </ImageBackground>
      </TouchableOpacity>

      <Text
        style={[styles.voteNumberStyle, { display: isMatch ? 'none' : 'flex' }]}
      >
        {`${voteCount} ${I18n.t('votes')}`}
      </Text>
    </View>
  </ImageBackground>
);

Card.propTypes = {
  matchName: PropTypes.string,
  creatorName: PropTypes.string,
  cardText: PropTypes.string,
  isMaster: PropTypes.bool,
  isMatch: PropTypes.bool,
  isBingo: PropTypes.bool,
  onVotePress: PropTypes.func,
  onBingoPress: PropTypes.func,
  onDeletePress: PropTypes.func,
  voted: PropTypes.bool,
  voteCount: PropTypes.number,
};

Card.defaultProps = {
  matchName: '',
  creatorName: '',
  cardText: '',
  isMaster: false,
  isMatch: false,
  isBingo: false,
  onVotePress: () => {},
  onBingoPress: () => {},
  onDeletePress: () => {},
  voted: false,
  voteCount: 0,
};

export { Card };
