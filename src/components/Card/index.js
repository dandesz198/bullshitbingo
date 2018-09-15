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

// NEEDS TO BE REFACTORED - NTBR
/**
 * This is card component displayed on the room and match view
 *
 * @param {string} matchName - The text on the upper-left of the card
 * @param {string} creatorName - The text on the upper-right of the card
 * @param {string} cardText - The main text of the card
 * @param {bool} isMaster - (passed when it's a match card) Defines if the user is the master of the card in any way
 * @param {bool} isVoteable - Defines if the card is voteable or not
 * @param {bool} isBingo - Defines if the card is bingoed (passed down to the Button's 'isFilled' prop)
 * @param {func} onVotePress - The function that runs when the user tries to press on the vote button
 * @param {func} onDeletePress - The function that runs when the user tries to press on the delete button
 * @param {func} onBingoPress - The function that runs when the user tries to press on the bingo button
 * @param {bool} voted - Defines if the user voted on this card or not
 * @param {number} voteCount - The text on the lower-right of the card
 */

const Card = ({
  matchName,
  creatorName,
  cardText,
  isMaster,
  isVoteable,
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
        {isMaster && (
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
          isFilled={isVoteable && voted}
          text={!isVoteable ? I18n.t('join') : I18n.t('vote')}
        />
      )}
      {isVoteable &&
        (isBingo || isMaster) && (
          <Button
            onPress={() => {
              onBingoPress();
            }}
            isSmall
            isFilled={isBingo}
            text={I18n.t('bingo')}
          />
        )}
      {isVoteable && (
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
  isVoteable: PropTypes.bool,
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
  isVoteable: false,
  isBingo: false,
  onVotePress: () => {},
  onBingoPress: () => {},
  onDeletePress: () => {},
  voted: false,
  voteCount: 0,
};

export { Card };
