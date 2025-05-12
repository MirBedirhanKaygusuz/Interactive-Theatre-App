// src/services/socketService.js
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket = null;
let listeners = {};
const SERVER_URL = 'http://192.168.0.100:3001'; // ASUS ROG GT6 Mesh WiFi System IP'si

// Socket.io bağlantısı oluşturma
export const initializeSocket = (onConnectChange) => {
  if (socket) return socket;

  socket = io(SERVER_URL, {
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 5000,
  });

  // Bağlantı olayları
  socket.on('connect', () => {
    console.log('Socket bağlantısı kuruldu');
    AsyncStorage.getItem('seatNumber').then(seatNumber => {
      if (seatNumber) {
        registerSeat(seatNumber);
      }
    });
    onConnectChange && onConnectChange(true);
  });

  socket.on('disconnect', () => {
    console.log('Socket bağlantısı kesildi');
    onConnectChange && onConnectChange(false);
  });

  socket.on('connect_error', (error) => {
    console.error('Bağlantı hatası:', error);
    onConnectChange && onConnectChange(false);
  });

  return socket;
};

// Koltuk numarası ile kayıt
export const registerSeat = (seatNumber) => {
  if (!socket || !socket.connected) return false;
  
  socket.emit('register-audience', { seatNumber });
  AsyncStorage.setItem('seatNumber', seatNumber);
  return true;
};

// El kaldırma
export const raiseHand = (seatNumber) => {
  if (!socket || !socket.connected) return false;
  
  socket.emit('raise-hand', { seatNumber });
  return true;
};

// Olay dinleyicisi ekleme
export const addListener = (event, callback) => {
  if (!socket) return;
  
  // Varolan dinleyiciyi kaldır
  if (listeners[event]) {
    socket.off(event, listeners[event]);
  }
  
  // Yeni dinleyici ekle
  socket.on(event, callback);
  listeners[event] = callback;
};

// Dinleyiciyi kaldırma
export const removeListener = (event) => {
  if (!socket || !listeners[event]) return;
  
  socket.off(event, listeners[event]);
  delete listeners[event];
};

// Tüm dinleyicileri temizleme
export const cleanupListeners = () => {
  if (!socket) return;
  
  Object.keys(listeners).forEach(event => {
    socket.off(event, listeners[event]);
  });
  listeners = {};
};

// Bağlantıyı kapatma
export const closeConnection = () => {
  if (!socket) return;
  
  cleanupListeners();
  socket.disconnect();
  socket = null;
};

// Mevcut bağlantı durumunu kontrol etme
export const isConnected = () => {
  return socket && socket.connected;
};