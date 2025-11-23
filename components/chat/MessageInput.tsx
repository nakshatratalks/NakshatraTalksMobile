import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Send } from 'lucide-react-native';
import { useResponsiveLayout } from '../../src/utils/responsive';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  sending?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  sending = false,
}) => {
  const { scale } = useResponsiveLayout();
  const [message, setMessage] = useState('');
  const sendButtonScale = useRef(new Animated.Value(1)).current;

  const handleSend = () => {
    if (message.trim() && !sending && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const onSendPressIn = () => {
    Animated.spring(sendButtonScale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const onSendPressOut = () => {
    Animated.spring(sendButtonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const canSend = message.trim().length > 0 && !sending && !disabled;

  return (
    <View style={styles.container}>
        {/* Input Container */}
        <View
          style={[
            styles.inputContainer,
            {
              paddingTop: 8 * scale,
              paddingBottom: 8 * scale,
              paddingHorizontal: 8 * scale,
            },
          ]}
        >
          <View
            style={[
              styles.inputRow,
              {
                gap: 8 * scale,
              },
            ]}
          >
            {/* Text Input */}
            <View
              style={[
                styles.textInputContainer,
                {
                  paddingHorizontal: 12 * scale,
                  paddingVertical: 8 * scale,
                  borderRadius: 24 * scale,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.textInput,
                  {
                    fontSize: 16 * scale,
                    minHeight: 24 * scale,
                  },
                ]}
                value={message}
                onChangeText={setMessage}
                placeholder="Message"
                placeholderTextColor="rgba(0, 0, 0, 0.4)"
                multiline
                maxLength={1000}
                editable={!disabled && !sending}
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
            </View>

            {/* Send Button */}
            <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    width: 44 * scale,
                    height: 44 * scale,
                    borderRadius: 22 * scale,
                    opacity: canSend ? 1 : 0.5,
                  },
                ]}
                onPress={handleSend}
                onPressIn={onSendPressIn}
                onPressOut={onSendPressOut}
                activeOpacity={1}
                disabled={!canSend}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send
                    size={20 * scale}
                    color="#FFFFFF"
                    fill="#FFFFFF"
                    strokeWidth={2}
                  />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Bottom Spacer (Home Indicator) */}
        <View
          style={[
            styles.bottomSpacer,
            {
              height: Platform.OS === 'ios' ? 20 * scale : 8 * scale,
            },
          ]}
        />
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F0F0',
  },
  inputContainer: {
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    fontFamily: 'Lexend_400Regular',
    color: '#000000',
    paddingVertical: 0,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  bottomSpacer: {
    backgroundColor: '#F0F0F0',
  },
});

export default MessageInput;
