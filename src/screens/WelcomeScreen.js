// src/screens/WelcomeScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { registerSeat } from '../services/socketService';
import ConnectionStatus from '../components/ConnectionStatus';

const WelcomeScreen = ({ connected, onRegisterSuccess }) => {
  const [seatNumber, setSeatNumber] = useState('');

  const handleRegister = () => {
    if (!seatNumber.trim()) {
      Alert.alert('Uyarı', 'Lütfen koltuk numaranızı girin');
      return;
    }
    
    if (!connected) {
      Alert.alert('Bağlantı Hatası', 'Sunucuya bağlantı kurulamadı. Lütfen WiFi bağlantınızı kontrol edin.');
      return;
    }
    
    const success = registerSeat(seatNumber);
    if (success) {
      onRegisterSuccess(seatNumber);
    } else {
      Alert.alert('Hata', 'Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>İnteraktif Tiyatro</Text>
      <Text style={styles.subtitle}>Katılım Sistemi</Text>
      
      <ConnectionStatus connected={connected} />
      
      <View style={styles.formContainer}>
        <Text style={styles.label}>Koltuk Numaranız</Text>
        <TextInput
          style={styles.input}
          placeholder="Örn: A12, B5"
          value={seatNumber}
          onChangeText={setSeatNumber}
          autoCapitalize="characters"
          maxLength={4}
        />
        
        <TouchableOpacity 
          style={[styles.button, !connected && styles.buttonDisabled]} 
          onPress={handleRegister} 
          disabled={!connected}
        >
          <Text style={styles.buttonText}>Katıl</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 40,
    color: '#666',
  },
  formContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 18,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WelcomeScreen;