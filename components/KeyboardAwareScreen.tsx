import React from 'react';
import { KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: any;
  noDismiss?: boolean;
}

export default function KeyboardAwareScreen({ children, style, noDismiss }: Props) {
  const content = (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {children}
    </KeyboardAvoidingView>
  );

  if (noDismiss) return content;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {content}
    </TouchableWithoutFeedback>
  );
}
