import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Animated, StyleSheet, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info';

type ToastMessage = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType>({ show: () => {} });

const ICONS: Record<ToastType, React.ComponentProps<typeof Ionicons>['name']> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
};

const COLORS: Record<ToastType, string> = {
  success: '#22C55E',
  error: '#EF4444',
  info: '#0EA5AE',
};

function ToastItem({ message, type, onDone }: ToastMessage & { onDone: () => void }) {
  const opacity = useMemo(() => new Animated.Value(0), []);
  const translateY = useMemo(() => new Animated.Value(20), []);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start(onDone);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const color = COLORS[type];

  return (
    <Animated.View style={[s.toast, { opacity, transform: [{ translateY }] }]}>
      <View style={[s.iconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={ICONS[type]} size={18} color={color} />
      </View>
      <Text style={s.message} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

let _counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++_counter;
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={s.container} pointerEvents="none">
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onDone={() => remove(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { flex: 1, fontSize: 14, color: '#F9FAFB', fontWeight: '500', lineHeight: 19 },
});
