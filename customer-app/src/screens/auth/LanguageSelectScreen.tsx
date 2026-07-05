import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@grocery/shared';
import { useLanguageStore } from '../../store/useLanguageStore';

export function LanguageSelectScreen() {
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Local Grocery</Text>
      <Text style={styles.subtitle}>Choose your language / अपनी भाषा चुनें</Text>

      <Pressable style={styles.option} onPress={() => setLanguage('en')}>
        <Text style={styles.optionText}>English</Text>
      </Pressable>
      <Pressable style={styles.option} onPress={() => setLanguage('hi')}>
        <Text style={styles.optionText}>हिन्दी</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginBottom: 32,
  },
  option: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
});
