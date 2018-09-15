import React from 'react';
import { View, ScrollView, Image, StatusBar } from 'react-native';
import { Button, Text } from '@components';
import { Images } from '@assets';

import styles from './styles';
import I18n from '../../i18n';

export const Onboarding = ({ hideOnboarding }) => (
  <ScrollView style={{ flex: 1 }} pagingEnabled horizontal vertical={false}>
    <StatusBar barStyle="dark-content" />
    <View style={styles.onboardContainter}>
      <Image
        source={Images.icon}
        style={{ width: 125, height: 125, marginBottom: 20 }}
      />
      <Text isBold style={{ fontSize: 30, textAlign: 'center' }}>
        {I18n.t('onboard_welcome')}
      </Text>
      <Text isBold style={{ fontSize: 20, textAlign: 'center', marginTop: 5 }}>
        {I18n.t('onboard_welcome_desc')}
      </Text>
      <Text
        isBold={false}
        style={{ fontSize: 30, textAlign: 'center', marginTop: 20 }}
      >
        {I18n.t('onboard_welcome_swipe')}
      </Text>
    </View>
    <View style={styles.onboardContainter}>
      <Text isBold style={{ fontSize: 30, textAlign: 'center' }}>
        {I18n.t('onboard_rooms')}
      </Text>
      <Text isBold style={{ fontSize: 20, textAlign: 'center' }}>
        {I18n.t('onboard_rooms_desc')}
      </Text>
    </View>
    <View style={[styles.onboardContainter, { padding: 0 }]}>
      <View
        style={[
          styles.onboardContainter,
          { marginTop: 'auto', marginBottom: 'auto' },
        ]}
      >
        <Text isBold style={{ fontSize: 30, textAlign: 'center' }}>
          {I18n.t('onboard_matches')}
        </Text>
        <Text isBold style={{ fontSize: 20, textAlign: 'center' }}>
          {I18n.t('onboard_matches_desc')}
        </Text>
      </View>
      <Image
        source={Images.create_child}
        style={{
          width: 120,
          height: 87,
          marginTop: 'auto',
          marginBottom: 0,
        }}
      />
    </View>
    <View style={styles.onboardContainter}>
      <Image
        source={Images.tutorial_card}
        style={{ width: 300, height: 125, marginBottom: 20 }}
      />
      <Text isBold style={{ fontSize: 30, textAlign: 'center' }}>
        {I18n.t('onboard_cards')}
      </Text>
      <Text isBold style={{ fontSize: 20, textAlign: 'center' }}>
        {I18n.t('onboard_cards_desc')}
      </Text>
    </View>
    <View style={styles.onboardContainter}>
      <Image
        source={Images.firework}
        style={{ width: 125, height: 125, marginBottom: 20 }}
      />
      <Text isBold style={{ fontSize: 30, textAlign: 'center' }}>
        {I18n.t('onboard_bingo')}
      </Text>
      <Text isBold style={{ fontSize: 20, textAlign: 'center' }}>
        {I18n.t('onboard_bingo_desc')}
      </Text>
    </View>
    <View style={styles.onboardContainter}>
      <Text isBold style={{ fontSize: 30, textAlign: 'center' }}>
        {I18n.t('onboard_start')}
      </Text>
      <Text isBold style={{ fontSize: 20, textAlign: 'center' }}>
        {I18n.t('onboard_start_desc')}
      </Text>
      <Button
        onPress={() => {
            hideOnboarding();
        }}
        style={{ marginTop: 15 }}
        text={I18n.t('onboard_start_btn')}
      />
      <Image
        source={Images.add_child}
        style={{ width: 70, height: 59, marginTop: -2.5 }}
      />
    </View>
  </ScrollView>
);

export default { Onboarding };
