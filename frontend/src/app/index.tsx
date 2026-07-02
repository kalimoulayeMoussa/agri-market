import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Image, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

import { Sprout } from 'lucide-react-native';

export default function IndexScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === 'FARMER') {
          router.replace('/(farmer)');
        } else {
          router.replace('/(consumer)');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* Un design épuré et premium avec un dégradé de vert */}
        <View style={styles.logoBadge}>
          <Sprout size={45} color="#2D6A4F" />
        </View>
        <Text style={styles.title}>AgriMarket</Text>
        <Text style={styles.subtitle}>Du producteur au consommateur</Text>
      </View>
      <ActivityIndicator size="large" color="#2D6A4F" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Alabaster chaud
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 45,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B4332', // Vert forêt profond
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loader: {
    marginTop: 20,
  },
});
