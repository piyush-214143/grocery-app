import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS } from '@grocery/shared';

interface Props {
  qty: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
}

export function QuantityStepper({ qty, onIncrement, onDecrement, disabled, size = 'medium' }: Props) {
  const height = size === 'small' ? 32 : 38;

  return (
    <View style={[styles.container, { height }, disabled && styles.disabled]}>
      <Pressable
        onPress={onDecrement}
        disabled={disabled}
        style={styles.button}
        hitSlop={8}
        accessibilityLabel="Decrease quantity"
      >
        <Text style={styles.buttonText}>−</Text>
      </Pressable>
      <Text style={styles.qty}>{qty}</Text>
      <Pressable
        onPress={onIncrement}
        disabled={disabled}
        style={styles.button}
        hitSlop={8}
        accessibilityLabel="Increase quantity"
      >
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
  button: {
    paddingHorizontal: 12,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  qty: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
});
