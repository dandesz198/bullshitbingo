import React from 'react';
import { TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import { Button, Text, Link } from '@components';
import { Images } from '@assets';
import styles from './styles';
import I18n from '../../i18n';

export const About = ({ close }) => (
  <ScrollView style={{ flex: 1, padding: 25 }}>
    <Text isBold style={{ fontSize: 40, marginTop: 20 }}>
      {I18n.t('bullshit_bingo')}
    </Text>
    <Text isBold={false} style={{ fontSize: 20 }}>
      {`${I18n.t('desc_1')}${'\n'}${'\n'}${I18n.t('desc_2')}${'\n'}${I18n.t(
        'desc_3'
      )}`}
    </Text>
    <Text isBold style={{ fontSize: 40, marginTop: 15 }}>
      {I18n.t('rules')}
    </Text>
    <Text isBold={false} style={{ fontSize: 20 }}>
      {`• ${I18n.t('rule_1')}${'\n'}• ${I18n.t('rule_2')}${'\n'}• ${I18n.t(
        'rule_3'
      )}${'\n'}• ${I18n.t('rule_4')}${'\n'}• ${I18n.t(
        'rule_5'
      )}${'\n'}• ${I18n.t('rule_6')}`}
    </Text>
    <Text isBold style={{ fontSize: 40, marginTop: 15 }}>
      {I18n.t('creator')}
    </Text>
    <Text isBold style={{ fontSize: 20 }}>
      {I18n.t('open_source')}
    </Text>
    <Link
      text={I18n.t('github')}
      url="https://github.com/dandesz198/bullshitbingo"
    />
    <Text isBold style={{ fontSize: 20, marginTop: 10 }}>
      {I18n.t('daniel_g')}
    </Text>
    <Link text="GitHub" url="https://github.com/dandesz198" />
    <Link text="Facebook" url="https://fb.me/dandesz198" />
    <Link text="Twitter" url="https://twitter.com/dandesz198" />
    <Link text="LinkedIn" url="https://linkedin.com/in/dandesz198" />
    <Text isBold style={{ fontSize: 40, marginTop: 15 }}>
      {I18n.t('legal')}
    </Text>
    <Text isBold={false} style={{ fontSize: 16 }}>
      {`${I18n.t('font_family')}: Cabin Sketch${'\n'}${I18n.t(
        'illustrator'
      )} : Freepik`}
    </Text>
    <Link
      text={I18n.t('link_to_vector')}
      url="https://www.flaticon.com/free-icon/poo_720965"
    />
    <Text isBold={false} style={{ fontSize: 16 }}>
      {`${I18n.t('poop')}: Flaticon (by Freepik)`}
    </Text>
    <Link
      text={I18n.t('link_to_poop')}
      url="https://www.freepik.com/free-vector/sketchy-children_797063.htm"
    />
    <TouchableOpacity
      style={{ marginLeft: 'auto', marginRight: 'auto', marginTop: 15 }}
      onPress={() => {
        Linking.openURL('https://paypal.me/dandesz198');
      }}
    >
      <Image source={Images.coffee} style={{ height: 45, width: 225 }} />
    </TouchableOpacity>
    <Text
      isBold
      style={[styles.p, { fontSize: 16, textAlign: 'center', marginTop: 5 }]}
    >
      {I18n.t('server_donate')}
    </Text>
    <Button
      onPress={() => close()}
      style={{
        marginTop: 20,
        marginBottom: 40,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
      isWide
      text={I18n.t('close')}
    />
  </ScrollView>
);

export default { About };
