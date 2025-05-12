// App.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, StatusBar, AppState } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ekranlar
import WelcomeScreen from './src/screens/WelcomeScreen';
import WaitingScreen from './src/screens/WaitingScreen';
import QuestionScreen from './src/screens/QuestionScreen';
import SelectedScreen from './src/screens/SelectedScreen';

// Servisler
import { 
  initializeSocket, 
  addListener, 
  cleanupListeners, 
  isConnected 
} from './src/services/socketService';

export default function App() {
  const [connected, setConnected] = useState(false);
  const [seatNumber, setSeatNumber] = useState('');
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [handRaised, setHandRaised] = useState(false);
  const [sound, setSound] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);

  // Uygulama başlangıcında
  useEffect(() => {
    // Koltuk numarasını yerel depolamadan yükle
    AsyncStorage.getItem('seatNumber').then(storedSeatNumber => {
      if (storedSeatNumber) {
        setSeatNumber(storedSeatNumber);
        // Eğer koltuk numarası varsa, bekleme ekranına geç
        setCurrentScreen('waiting');
      }
    });

    // Socket bağlantısı başlat
    initializeSocket(setConnected);

    // Socket olaylarını dinle
    setupSocketListeners();

    // Ses dosyasını yükle
    loadSound();

    // AppState değişikliklerini takip et (arka plan/ön plan)
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
    });

    return () => {
      // Temizleme işlemleri
      cleanupListeners();
      subscription.remove();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // AppState değişikliğinde (arka plandan ön plana)
  useEffect(() => {
    if (appState === 'active' && seatNumber) {
      // Uygulama ön plana geldiğinde, socket bağlantısını kontrol et
      if (!isConnected()) {
        initializeSocket(setConnected);
        setupSocketListeners();
      }
    }
  }, [appState]);

  // Socket olaylarını dinle
  const setupSocketListeners = () => {
    // Soru açıldı
    addListener('question-opened', () => {
      setCurrentScreen('question');
      setHandRaised(false);
    });

    // Soru kapandı
    addListener('question-closed', () => {
      setCurrentScreen('waiting');
      setHandRaised(false);
    });

    // Seçildi
    addListener('selected', () => {
      setCurrentScreen('selected');
      playSound();
    });
  };

  // Bildirim sesi yükleme
  const loadSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/notification.mp3')
      );
      setSound(sound);
    } catch (error) {
      console.error('Ses yüklenirken hata:', error);
    }
  };

  // Bildirim sesi çalma
  const playSound = async () => {
    if (sound) {
      try {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      } catch (error) {
        console.error('Ses çalınırken hata:', error);
      }
    }
  };

  // Koltuk kaydı başarılı olduğunda
  const handleRegistrationSuccess = (seat) => {
    setSeatNumber(seat);
    setCurrentScreen('waiting');
  };

  // El kaldırıldığında
  const handleHandRaised = () => {
    setHandRaised(true);
  };

  // Şu anki ekrana göre içeriği göster
  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <WelcomeScreen 
            connected={connected}
            onRegisterSuccess={handleRegistrationSuccess}
          />
        );
      case 'waiting':
        return (
          <WaitingScreen 
            connected={connected}
            seatNumber={seatNumber}
          />
        );
      case 'question':
        return (
          <QuestionScreen 
            connected={connected}
            seatNumber={seatNumber}
            handRaised={handRaised}
            onHandRaised={handleHandRaised}
          />
        );
      case 'selected':
        return (
          <SelectedScreen 
            seatNumber={seatNumber}
          />
        );
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});