import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Linking,
  Dimensions
} from 'react-native';
import { Audio } from 'expo-av';
import { ChatMessage, ChatResponse, Merchant, TravelOption, SupportItem } from '@paytm-hackathon/types';

const { width } = Dimensions.get('window');

// Backend endpoints configuration
const BACKEND_URL = 'http://localhost:8000'; // Update for device debugging (e.g. http://192.168.1.X:8000)

interface AppChatMessage extends ChatMessage {
  intent?: string;
  structured_data?: any;
  transcription?: string;
}

export default function App() {
  const [messages, setMessages] = useState<AppChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I am your Paytm Smart Voice Assistant. How can I help you today? You can search for nearby stores, look up flights and trains, or ask me account support questions."
    }
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentLocation, setCurrentLocation] = useState<'Noida' | 'Delhi' | 'Mumbai'>('Noida');
  const [sessionId] = useState(`session_${Math.random().toString(36).substr(2, 9)}`);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Coordinate mapping for mock location
  const coordinates = {
    Noida: { latitude: 28.5355, longitude: 77.3910 },
    Delhi: { latitude: 28.6139, longitude: 77.2090 },
    Mumbai: { latitude: 19.0760, longitude: 72.8777 }
  };

  useEffect(() => {
    // Request microphone permissions
    Audio.requestPermissionsAsync();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Play sound from base64 string
  const playBase64Audio = async (base64String: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      const uri = `data:audio/wav;base64,${base64String}`;
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      setSound(newSound);
    } catch (error) {
      console.log('Error playing voice response:', error);
    }
  };

  // Text query handler
  const handleSendText = async () => {
    if (!query.trim()) return;
    const userMessage: AppChatMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);
    scrollToBottom();

    const { latitude, longitude } = coordinates[currentLocation];

    try {
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage.content,
          session_id: sessionId,
          history: chatHistory,
          latitude,
          longitude
        })
      });

      if (response.ok) {
        const data: ChatResponse = await response.json();
        const botMessage: AppChatMessage = {
          role: 'assistant',
          content: data.text,
          intent: data.intent,
          structured_data: data.structured_data
        };
        setMessages(prev => [...prev, botMessage]);
        
        if (data.voice_audio_base64) {
          playBase64Audio(data.voice_audio_base64);
        }
      } else {
        throw new Error('Server returned error status');
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I couldn't reach the server. Please verify the FastAPI backend is running locally on port 8000."
        }
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  // Voice recording handlers
  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) return;

      setLoading(true);
      scrollToBottom();

      const { latitude, longitude } = coordinates[currentLocation];
      
      // Construct Form Data
      const formData = new FormData();
      // @ts-ignore: React Native specific file upload structure
      formData.append('file', {
        uri: uri,
        name: 'voice_input.wav',
        type: 'audio/wav'
      });
      formData.append('session_id', sessionId);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());

      const response = await fetch(`${BACKEND_URL}/api/voice-chat`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data'
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        // Append user transcribed text
        setMessages(prev => [
          ...prev,
          { role: 'user', content: data.transcription || 'Voice Query' }
        ]);

        // Append assistant response
        const botMessage: AppChatMessage = {
          role: 'assistant',
          content: data.text,
          intent: data.intent,
          structured_data: data.structured_data
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        if (data.voice_audio_base64) {
          playBase64Audio(data.voice_audio_base64);
        }
      } else {
        throw new Error('Failed voice response processing');
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Failed to process audio message. Check backend connectivity."
        }
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  // Sub-components for customized UI cards
  const renderMerchantCard = (merchant: Merchant) => (
    <View key={merchant.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{merchant.name}</Text>
        <Text style={styles.ratingBadge}>★ {merchant.rating}</Text>
      </View>
      <Text style={styles.cardCategory}>{merchant.category.toUpperCase()} • {merchant.distance_meters}m away</Text>
      <Text style={styles.cardSubtitle}>{merchant.address}</Text>
      {merchant.deals && merchant.deals.length > 0 && (
        <View style={styles.dealContainer}>
          <Text style={styles.dealLabel}>ACTIVE OFFER:</Text>
          <Text style={styles.dealTitle}>{merchant.deals[0].title}</Text>
          <Text style={styles.dealDesc}>{merchant.deals[0].description}</Text>
        </View>
      )}
    </View>
  );

  const renderTravelCard = (option: TravelOption) => (
    <View key={option.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.travelBadge}>{option.type.toUpperCase()}</Text>
        <Text style={styles.priceText}>₹{option.price}</Text>
      </View>
      <Text style={styles.cardTitle}>{option.provider} - {option.name}</Text>
      {option.departure_time && (
        <Text style={styles.cardSubtitle}>
          Route: {option.origin} ➔ {option.destination}
        </Text>
      )}
      {option.departure_time && (
        <Text style={styles.timeText}>
          Departs: {new Date(option.departure_time).toLocaleDateString()} at {new Date(option.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
      <Text style={styles.detailsText}>{option.details}</Text>
    </View>
  );

  const renderSupportCard = (item: SupportItem) => (
    <View key={item.id} style={styles.card}>
      <Text style={styles.cardTitle}>{item.question}</Text>
      <Text style={styles.supportAnswer}>{item.answer}</Text>
      {item.action_link && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Linking.openURL(item.action_link!)}
        >
          <Text style={styles.actionButtonText}>Proceed In-App</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderMessageContent = (msg: AppChatMessage) => {
    if (msg.role === 'user') {
      return <Text style={styles.userMessageText}>{msg.content}</Text>;
    }

    return (
      <View>
        <Text style={styles.assistantMessageText}>{msg.content}</Text>
        {msg.intent && msg.intent !== 'general' && msg.structured_data && (
          <View style={styles.resultsContainer}>
            {msg.intent === 'merchant' && msg.structured_data.merchants?.map((m: Merchant) => renderMerchantCard(m))}
            {msg.intent === 'travel' && msg.structured_data.options?.map((t: TravelOption) => renderTravelCard(t))}
            {msg.intent === 'support' && msg.structured_data.items?.map((s: SupportItem) => renderSupportCard(s))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Paytm Voice Box</Text>
          <Text style={styles.headerSubtitle}>AI Monorepo Agent Demo</Text>
        </View>
        <View style={styles.locationSelector}>
          {['Noida', 'Delhi', 'Mumbai'].map(loc => (
            <TouchableOpacity
              key={loc}
              style={[
                styles.locationBtn,
                currentLocation === loc && styles.locationBtnActive
              ]}
              onPress={() => setCurrentLocation(loc as any)}
            >
              <Text
                style={[
                  styles.locationBtnText,
                  currentLocation === loc && styles.locationBtnTextActive
                ]}
              >
                {loc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={scrollToBottom}
      >
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble
            ]}
          >
            {renderMessageContent(msg)}
          </View>
        ))}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#00baf2" />
            <Text style={styles.loadingText}>Synthesizing voice response...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input / Control Panel */}
      <View style={styles.controlPanel}>
        {isRecording && (
          <View style={styles.waveContainer}>
            <Text style={styles.waveText}>🎤 Listening to your voice...</Text>
            <View style={styles.waveIndicator} />
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask anything..."
            placeholderTextColor="#667085"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSendText}
          />
          <TouchableOpacity
            style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
          >
            <Text style={styles.recordBtnText}>{isRecording ? 'Listening' : 'Hold to Speak'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendBtn} onPress={handleSendText}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19', // Sleek dark blue
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00baf2', // Paytm blue
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  locationSelector: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 2,
  },
  locationBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  locationBtnActive: {
    backgroundColor: '#00baf2',
  },
  locationBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  locationBtnTextActive: {
    color: '#0f172a',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    marginVertical: 6,
    maxWidth: width * 0.85,
  },
  userBubble: {
    backgroundColor: '#002970', // Deep royal blue
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: '#1e293b',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
  },
  userMessageText: {
    color: '#ffffff',
    fontSize: 15,
  },
  assistantMessageText: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    alignSelf: 'flex-start',
  },
  loadingText: {
    color: '#94a3b8',
    marginLeft: 8,
    fontSize: 13,
  },
  controlPanel: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    padding: 12,
  },
  waveContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  waveText: {
    color: '#00baf2',
    fontWeight: '600',
    fontSize: 13,
  },
  waveIndicator: {
    height: 4,
    backgroundColor: '#00baf2',
    width: '60%',
    borderRadius: 2,
    marginTop: 6,
    opacity: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#ffffff',
    marginRight: 8,
    fontSize: 14,
  },
  recordBtn: {
    backgroundColor: '#002970',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  recordBtnActive: {
    backgroundColor: '#e11d48',
  },
  recordBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sendBtn: {
    backgroundColor: '#00baf2',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Cards styling
  resultsContainer: {
    marginTop: 12,
    width: '100%',
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
    width: width * 0.75,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  cardCategory: {
    fontSize: 11,
    color: '#00baf2',
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  },
  ratingBadge: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  dealContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  dealLabel: {
    fontSize: 9,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  dealTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  dealDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  travelBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    backgroundColor: '#00baf2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ade80',
  },
  timeText: {
    fontSize: 12,
    color: '#e2e8f0',
    marginVertical: 2,
  },
  detailsText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  supportAnswer: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
    marginVertical: 6,
  },
  actionButton: {
    backgroundColor: '#00baf2',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  actionButtonText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 12,
  }
});
