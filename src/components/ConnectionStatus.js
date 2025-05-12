// src/components/ConnectionStatus.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ConnectionStatus = ({ connected }) => {
  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.indicator, 
          connected ? styles.connected : styles.disconnected
        ]} 
      />
      <Text style={styles.text}>
        {connected ? 'Bağlı' : 'Bağlantı Bekleniyor'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#F44336',
  },
  text: {
    fontSize: 14,
    color: '#555',
  },
});

export default ConnectionStatus;