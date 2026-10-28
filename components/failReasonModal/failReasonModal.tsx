import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Props {
  visible: boolean;
  orderId: string;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}

const MAX_REASON = 500; // order-service rejects longer reasons

export default function FailReasonModal({ visible, orderId, onCancel, onSubmit }: Props) {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();
  const valid = trimmed.length > 0 && trimmed.length <= MAX_REASON;

  // Start every opening with an empty box (adjusting state during render, not in an effect)
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setReason('');
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Delivery failed</Text>
          <Text style={styles.text}>Order ID: {orderId}</Text>
          <TextInput
            testID="fail-reason-input"
            style={styles.input}
            placeholder="What happened? (required)"
            placeholderTextColor="#888"
            value={reason}
            onChangeText={setReason}
            maxLength={MAX_REASON}
            multiline
          />
          <View style={styles.row}>
            <TouchableOpacity accessibilityRole="button" style={[styles.button, styles.back]} onPress={onCancel}>
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ disabled: !valid }}
              disabled={!valid}
              style={[styles.button, styles.submit, !valid && styles.disabled]}
              onPress={() => onSubmit(trimmed)}
            >
              <Text style={styles.buttonText}>Mark failed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  card: { width: '85%', backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  text: { fontSize: 14, color: '#666', marginBottom: 12 },
  input: { minHeight: 80, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, color: '#000', textAlignVertical: 'top' },
  row: { flexDirection: 'row', marginTop: 16 },
  button: { flex: 1, padding: 10, marginHorizontal: 5, borderRadius: 5, alignItems: 'center' },
  back: { backgroundColor: '#69bf70' },
  submit: { backgroundColor: '#d63031' },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
