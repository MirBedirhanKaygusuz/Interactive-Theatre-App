// src/screens/QuestionScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { raiseHand } from '../services/socketService';
import ConnectionStatus from '../components/ConnectionStatus';

const QuestionScreen = ({ connected, seatNumber, handRaised, onHandRaised }) => {
  const handleRaiseHand = () => {
    if (handRaised) return;
    
    const success = raiseHand(seatNumber);
    if (success) {
      onHandRaised();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.seatInfo}>Koltuk: {seatNumber}</Text>
        <ConnectionStatus connected={connected} />
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.questionBadge}>
          <Text style={styles.questionBadgeText}>SORU AKTİF</Text>
        </View>
        
        <Text style={styles.questionText}>
          Katılmak ister misiniz?
        </Text>
        
        <TouchableOpacity 
          style={[
            styles.raiseHandButton, 
            handRaised && styles.handRaisedButton,
            !connected && styles.buttonDisabled
          ]} 
          onPress={handleRaiseHand}
          disabled={handRaised || !connected}
        >
          <Text style={styles.raiseHandButtonText}>
            {handRaised ? '✓ El Kaldırıldı' : 'El Kaldır'}
          </Text>
        </TouchableOpacity>
        
        {handRaised && (
          <Text style={styles.waitMessage}>
            El kaldırdınız. Seçilirseniz ekranınız güncellenecektir.
          </Text>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f0f0f0',
  },
  seatInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  questionBadge: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 30,
  },
  questionBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
  },
  raiseHandButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginVertical: 30,
    elevation: 5,
  },
  handRaisedButton: {
    backgroundColor: '#8BC34A',
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  raiseHandButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  waitMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
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

export default QuestionScreen;