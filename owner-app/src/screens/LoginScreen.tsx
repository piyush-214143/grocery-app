import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { COLORS } from '@grocery/shared';
import { auth, db } from '../firebase';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || password.length < 6) {
      Alert.alert('', 'Enter an email and a password of at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      if (isFirstTimeSetup) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        // firestore.rules only allows shops/categories/products/orders
        // writes from a uid that has this doc -- see firestore.rules for why
        // it's a client-writable doc instead of a custom claim (avoids
        // needing Cloud Functions, which require the Blaze plan).
        await setDoc(doc(db, 'admins', cred.user.uid), { isOwner: true });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err: any) {
      Alert.alert('Failed', err.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Grocery Owner</Text>
      <Text style={styles.subtitle}>
        {isFirstTimeSetup ? 'Create your owner account' : 'Log in to manage your shop'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={COLORS.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isFirstTimeSetup ? 'Create Account' : 'Log In'}</Text>
        )}
      </Pressable>

      <Pressable onPress={() => setIsFirstTimeSetup((v) => !v)}>
        <Text style={styles.link}>
          {isFirstTimeSetup ? 'Already have an account? Log in' : 'First time setting up this shop? Create account'}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.accent, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 28, marginTop: 4 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    color: COLORS.text,
  },
  button: { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: COLORS.accent, textAlign: 'center', marginTop: 20, fontWeight: '600' },
});
