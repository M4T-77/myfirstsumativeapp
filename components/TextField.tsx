import React from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';

interface TextFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  editable?: boolean;
  style?: object;
  error?: string;
  characterCount?: number;
  maxLength?: number;
}

const TextField: React.FC<TextFieldProps> = ({ 
  value, 
  onChangeText, 
  placeholder, 
  multiline, 
  editable, 
  style, 
  error, 
  characterCount, 
  maxLength 
}) => {
  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8e8e93"
        multiline={multiline}
        editable={editable}
        style={[styles.input, style]}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {maxLength && (
        <Text style={styles.charCountText}>
          {characterCount}/{maxLength}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    fontSize: 17,
    color: '#fff',
    padding: 0,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
  },
  charCountText: {
    color: '#8e8e93',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
});

export default TextField;