import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Alert, 
  Platform,
  TextInput  // TextInput eksikti
} from 'react-native';
import { Camera } from 'expo-camera';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';  // AsyncStorage eksikti

// WebRTC entegrasyonu için
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  RTCView,
} from 'react-native-webrtc';

// expo-permissions modülü artık kullanımdan kaldırıldı, gerekli değil
// import * as Permissions from 'expo-permissions';
export default function App() {
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [seatNumber, setSeatNumber] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [questionActive, setQuestionActive] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  
  // Kamera ve Stream durumları
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasAudioPermission, setHasAudioPermission] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  
  // WebRTC bağlantısı için referans
  const peerConnectionRef = useRef(null);
  const cameraRef = useRef(null);
  
  // İzinleri kontrol et
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus === 'granted');
      
      const { status: audioStatus } = await Camera.requestMicrophonePermissionsAsync();
      setHasAudioPermission(audioStatus === 'granted');
    })();
  }, []);

  // Sunucu bağlantısı kurma
  useEffect(() => {
    // Önce kaydedilmiş koltuk numarasını kontrolü
    const loadSavedSeat = async () => {
      try {
        const savedSeat = await AsyncStorage.getItem('seatNumber');
        if (savedSeat) {
          setSeatNumber(savedSeat);
          setIsRegistered(true);
        }
      } catch (error) {
        console.error('AsyncStorage hatası:', error);
      }
    };
    
    loadSavedSeat();
    
    // Socket.io bağlantısı - IP adresini kendi bilgisayarınızın IP adresi ile değiştirin
    const newSocket = io('http://10.200.10.30:3001', {
      transports: ['websocket'],
      reconnectionAttempts: 5
    });
    
    // Bağlantı olayları
    newSocket.on('connect', () => {
      console.log('Sunucuya bağlandı!');
      setConnected(true);
      
      // Eğer koltuk numarası kaydedilmişse, sunucuya bildir
      if (seatNumber) {
        newSocket.emit('register-audience', { seatNumber });
      }
    });
    
    newSocket.on('disconnect', () => {
      console.log('Sunucu bağlantısı kesildi!');
      setConnected(false);
    });
    
    // Soru olayları
    newSocket.on('question-opened', () => {
      setQuestionActive(true);
      setHandRaised(false);
    });
    
    newSocket.on('question-closed', () => {
      setQuestionActive(false);
      setHandRaised(false);
    });
    
    newSocket.on('selected', () => {
      setIsSelected(true);
      // Kullanıcı seçildiğinde otomatik olarak yayını başlat
      startBroadcasting();
    });
    
    // WebRTC ile ilgili olayları dinle
    newSocket.on('rtc-offer', async (offer) => {
      if (!peerConnectionRef.current) createPeerConnection();
      
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        
        newSocket.emit('rtc-answer', {
          seatNumber,
          answer: peerConnectionRef.current.localDescription
        });
      } catch (error) {
        console.error('Offer işleme hatası:', error);
      }
    });
    
    newSocket.on('rtc-ice-candidate', (candidate) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
    
    newSocket.on('stop-broadcasting', () => {
      stopBroadcasting();
    });
    
    setSocket(newSocket);
    
    // Temizleme
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      newSocket.disconnect();
    };
  }, []);

  // WebRTC bağlantısı oluştur
  const createPeerConnection = () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    };
    
    const pc = new RTCPeerConnection(configuration);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('rtc-ice-candidate', {
          seatNumber,
          candidate: event.candidate
        });
      }
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', pc.iceConnectionState);
    };
    
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }
    
    peerConnectionRef.current = pc;
    return pc;
  };
  
  // Kamera ve mikrofon yayınını başlat
  // Kamera ve mikrofon yayınını başlat
const startBroadcasting = async () => {
    if (!hasCameraPermission || !hasAudioPermission) {
      Alert.alert(
        'İzin Gerekli',
        'Canlı yayın yapabilmek için kamera ve mikrofon izinleri gereklidir.',
        [{ text: 'Tamam' }]
      );
      return;
    }
    
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      setLocalStream(stream);
      
      // PeerConnection oluştur
      const pc = createPeerConnection();
      
      // Stream'i ekle
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      // Offer oluştur
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Offer'ı sunucuya gönder
      socket.emit('rtc-offer', {
        seatNumber,
        offer: pc.localDescription
      });
      
      setIsBroadcasting(true);
      
    } catch (error) {
      console.error('Yayın başlatma hatası:', error);
      Alert.alert(
        'Yayın Hatası',
        'Canlı yayın başlatılamadı. Lütfen tekrar deneyin.',
        [{ text: 'Tamam' }]
      );
    }
  };
  
  // Yayını durdur
  const stopBroadcasting = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setIsBroadcasting(false);
    
    if (socket) {
      socket.emit('stop-broadcasting', { seatNumber });
    }
  };
  
  // Koltuk kaydı
  const handleRegister = async () => {
    if (!seatNumber.trim()) {
      Alert.alert('Uyarı', 'Lütfen koltuk numaranızı girin');
      return;
    }
    
    if (!connected) {
      Alert.alert('Bağlantı Hatası', 'Sunucuya bağlantı kurulamadı');
      return;
    }
    
    // Sunucuya koltuk bilgisini gönder
    socket.emit('register-audience', { seatNumber });
    
    // Yerel depolamaya kaydet
    try {
      await AsyncStorage.setItem('seatNumber', seatNumber);
      setIsRegistered(true);
    } catch (error) {
      console.error('AsyncStorage kayıt hatası:', error);
      Alert.alert('Hata', 'Kayıt işlemi başarısız oldu');
    }
  };
  
  // El kaldırma
  const handleRaiseHand = () => {
    if (!connected || handRaised) return;
    
    socket.emit('raise-hand', { seatNumber });
    setHandRaised(true);
  };
  
  // Seçildi ekranı
  if (isSelected) {
    return (
      <SafeAreaView style={styles.selectedContainer}>
        <View style={styles.cameraContainer}>
          {localStream ? (
            <RTCView
            streamURL={localStream.toURL()}
            style={styles.camera}
            mirror={true}
            objectFit="cover"
            />
          ) : (
            <View style={styles.noCameraView}>
              <Text style={styles.noCameraText}>Kamera başlatılıyor...</Text>
            </View>
          )}
        </View>
        
        <View style={styles.selectedInfoContainer}>
          <View style={styles.selectionBadge}>
            <Text style={styles.selectionBadgeText}>✓</Text>
          </View>
          
          <Text style={styles.selectionText}>Seçildiniz!</Text>
          <Text style={styles.selectedSeatText}>Koltuk: {seatNumber}</Text>
          
          <Text style={styles.broadcastStatus}>
            {isBroadcasting ? 'Canlı Yayındasınız' : 'Yayın başlatılıyor...'}
          </Text>
          
          <Text style={styles.selectionInstruction}>
            Lütfen mikrofonu alıp soruyu yanıtlayın.
          </Text>
          
          <TouchableOpacity 
            style={styles.broadcastButton}
            onPress={isBroadcasting ? stopBroadcasting : startBroadcasting}
          >
            <Text style={styles.broadcastButtonText}>
              {isBroadcasting ? 'Yayını Durdur' : 'Yayını Başlat'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Karşılama ekranı
  if (!isRegistered) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>İnteraktif Tiyatro</Text>
        <Text style={styles.subtitle}>Katılım Sistemi</Text>
        
        <View style={styles.connectionIndicator}>
          <View style={[styles.dot, connected ? styles.connected : styles.disconnected]} />
          <Text style={styles.connectionText}>
            {connected ? 'Bağlı' : 'Bağlantı Bekleniyor'}
          </Text>
        </View>
        
        <View style={styles.form}>
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
      </SafeAreaView>
    );
  }
  
  // Soru aktif olduğunda
  if (questionActive) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.seatInfo}>Koltuk: {seatNumber}</Text>
          <View style={styles.connectionIndicator}>
            <View style={[styles.dot, connected ? styles.connected : styles.disconnected]} />
            <Text style={styles.connectionText}>
              {connected ? 'Bağlı' : 'Bağlantı Yok'}
            </Text>
          </View>
        </View>
        
        <View style={styles.questionContainer}>
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
      </SafeAreaView>
    );
  }
  
  // Bekleme ekranı (default durum)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.waitingContent}>
        <Text style={styles.seatInfo}>Koltuk: {seatNumber}</Text>
        
        <View style={styles.connectionIndicator}>
          <View style={[styles.dot, connected ? styles.connected : styles.disconnected]} />
          <Text style={styles.connectionText}>
            {connected ? 'Bağlı' : 'Bağlantı Yok'}
          </Text>
        </View>
        
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 60,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginVertical: 10,
  },
  dot: {
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
  connectionText: {
    fontSize: 14,
    color: '#555',
  },
  form: {
    width: '85%',
    alignSelf: 'center',
    marginTop: 40,
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
  
  // Bekleme ekranı
  waitingContent: {
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
  
  // Soru ekranı
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f0f0f0',
  },
  questionContainer: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  handRaisedButton: {
    backgroundColor: '#8BC34A',
  },
  raiseHandButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  
  // Seçilme ekranı
  selectedContainer: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  cameraContainer: {
    height: '40%',
    width: '100%',
    backgroundColor: '#333',
  },
  camera: {
    flex: 1,
  },
  noCameraView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCameraText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedInfoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  selectionBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  selectionBadgeText: {
    fontSize: 40,
    color: '#4CAF50',
  },
  selectionText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  selectedSeatText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
  },
  broadcastStatus: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  selectionInstruction: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 30,
  },
  broadcastButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  broadcastButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  }
});