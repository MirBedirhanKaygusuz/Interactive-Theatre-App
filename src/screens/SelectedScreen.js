// src/screens/SelectedScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const SelectedScreen = ({ seatNumber }) => {
  // Animasyon değeri
  const pulseAnim = new Animated.Value(1);
  
  // Seçildiğinde başlayacak animasyon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Animated.View 
          style={[
            styles.selectionBadge,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <Text style={styles.selectionBadgeText}>✓</Text>
        </Animated.View>
        
        <Text style={styles.selectionText}>Seçildiniz!</Text>
        
        <Text style={styles.seatInfo}>Koltuk: {seatNumber}</Text>
        
        <Text style={styles.instruction}>
          Lütfen mikrofonu alıp soruyu yanıtlayın.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  selectionBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  selectionBadgeText: {
    fontSize: 60,
    color: '#4CAF50',
  },
  selectionText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  seatInfo: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 30,
  },
  instruction: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
});

export default SelectedScreen;