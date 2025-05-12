// src/screens/WaitingScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ConnectionStatus from '../components/ConnectionStatus';

const WaitingScreen = ({ connected, seatNumber }) => {
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.seatInfo}>Koltuk: {seatNumber}</Text>
        <ConnectionStatus connected={connected} />
        
        <View style={styles.messageContainer}>
          <Text style={styles.waitMessage}>Sonraki soru için</Text>
          <Text style={styles.accentText}>hazır olun</Text>
        </View>
        
        <Text style={styles.instruction}>
          Reji soruyu aktifleştirdiğinde ekranınız otomatik olarak güncellenecektir.
        </Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Bağlantınızın kesilmemesi için lütfen uygulamayı kapatmayın
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  seatInfo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  messageContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  waitMessage: {
    fontSize: 22,
    color: '#666',
    marginBottom: 10,
  },
  accentText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  instruction: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  footer: {
    padding: 15,
    backgroundColor: '#eee',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

export default WaitingScreen;