import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
} from 'react-native';
import PropTypes from 'prop-types';
import styles from './styles';
import { Images } from '@assets';
import { Button } from '@components';
import I18n from '../../i18n';

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
        {isMaster &&
          !isMatch && (
            <TouchableOpacity
              style={{
                marginRight: 0,
                marginLeft: 'auto',
              }}
              onPress={() => {
                onDeletePress();
              }}
            >
              <Image
                source={Images.trash}
                style={{ height: 30, width: 21, marginVertical: 'auto' }}
              />
            </TouchableOpacity>
          )}
      </View>
    </View>
    <View style={styles.buttonBoxStyle}>
      {!isBingo && (
        <Button
          onPress={() => {
            onVotePress();
          }}
          isSmall
          style={{ marginRight: 10 }}
          isFilled={!isMatch && voted}
          text={isMatch ? I18n.t('join') : I18n.t('vote')}
        />
      )}
      {!isMaster ||
        (!isBingo && (
          <Button
            onPress={() => {
              onBingoPress();
            }}
            isSmall
            isFilled={isBingo}
            text={isMatch ? I18n.t('delete') : I18n.t('bingo')}
          />
        ))}
      {!isMatch && (
        <Text style={styles.voteNumberStyle}>
          {`${voteCount} ${I18n.t('votes')}`}
        </Text>
      )}
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
