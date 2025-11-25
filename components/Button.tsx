import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors } from '../styles/colors';

interface ButtonProps {
  onPress: () => void;
  title?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: object;
  textStyle?: object;
}

const Button: React.FC<ButtonProps> = ({ onPress, title, icon, disabled, loading, style, textStyle }) => {
  const textColor = (textStyle as any)?.color || styles.text.color;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, style, (disabled || loading) && styles.disabledButton]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon}
          {title && <Text style={[styles.text, textStyle, icon ? styles.textWithIcon : null]}>{title}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  textWithIcon: {
    marginLeft: 8,
  }
});

export default Button;
