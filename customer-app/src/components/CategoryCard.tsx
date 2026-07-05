import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, localize, type Category } from '@grocery/shared';
import { useLanguageStore } from '../store/useLanguageStore';

interface Props {
  category: Category;
  onPress: () => void;
}

export function CategoryCard({ category, onPress }: Props) {
  const language = useLanguageStore((s) => s.language);
  const name = localize(language, category.name_en, category.name_hi);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.iconWrap}>
        <Image source={{ uri: category.icon }} style={styles.icon} contentFit="cover" />
      </View>
      <Text numberOfLines={2} style={styles.name}>
        {name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 84,
    alignItems: 'center',
    marginRight: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
  name: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
});
