import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';
import { Mail, Lock, User, Phone, MapPin, Check, ShoppingCart, Sprout } from 'lucide-react-native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<'FARMER' | 'CONSUMER'>('CONSUMER');
  
  const { register, loading } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !fullName || !phone || !address) {
      Alert.alert("Champs requis", "Veuillez remplir tous les champs.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Erreur de mot de passe", "Le mot de passe doit faire au moins 6 caractères.");
      return;
    }

    try {
      // Tenter d'obtenir la géolocalisation lors de l'inscription
      let latitude = 12.3714; // Ouagadougou par défaut
      let longitude = -1.5197;
      
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // Utilisation d'un timeout de 2 secondes pour éviter le blocage indéfini sur le navigateur
          const loc = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
          ]).catch(() => null);

          if (loc && typeof loc === 'object' && 'coords' in loc) {
            latitude = loc.coords.latitude;
            longitude = loc.coords.longitude;
          }
        }
      } catch (err) {
        console.log("Géolocalisation non disponible lors de l'inscription", err);
      }

      await register({
        email,
        password,
        fullName,
        phone,
        address,
        role,
        latitude,
        longitude
      });

      if (Platform.OS === 'web') {
        alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
        router.replace('/login');
      } else {
        Alert.alert(
          "Inscription réussie !",
          "Vous pouvez maintenant vous connecter.",
          [{ text: "OK", onPress: () => router.replace('/login') }]
        );
      }
    } catch (e: any) {
      if (Platform.OS === 'web') {
        alert("Erreur d'inscription : " + (e.message || "L'e-mail est peut-être déjà pris."));
      } else {
        Alert.alert("Erreur d'inscription", e.message || "Impossible de s'inscrire. L'e-mail est peut-être déjà pris.");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez la communauté locale</Text>
        </View>

        {/* Sélection du rôle avec des cartes premium */}
        <View style={styles.roleSelectorContainer}>
          <TouchableOpacity 
            style={[styles.roleCard, role === 'CONSUMER' && styles.roleCardActive]} 
            onPress={() => setRole('CONSUMER')}
          >
            <View style={[styles.roleRadio, role === 'CONSUMER' && styles.roleRadioActive]}>
              {role === 'CONSUMER' && <Check size={12} color="#FFFFFF" />}
            </View>
            <ShoppingCart size={32} color={role === 'CONSUMER' ? '#2D6A4F' : '#94A3B8'} style={{ marginBottom: 8, marginTop: 4 }} />
            <Text style={styles.roleTitle}>Consommateur</Text>
            <Text style={styles.roleDesc}>J'achète des produits frais</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.roleCard, role === 'FARMER' && styles.roleCardActive]} 
            onPress={() => setRole('FARMER')}
          >
            <View style={[styles.roleRadio, role === 'FARMER' && styles.roleRadioActive]}>
              {role === 'FARMER' && <Check size={12} color="#FFFFFF" />}
            </View>
            <Sprout size={32} color={role === 'FARMER' ? '#2D6A4F' : '#94A3B8'} style={{ marginBottom: 8, marginTop: 4 }} />
            <Text style={styles.roleTitle}>Agriculteur</Text>
            <Text style={styles.roleDesc}>Je vends ma production</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <User size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nom complet / Nom d'exploitation"
              placeholderTextColor="#94A3B8"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Mail size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Adresse e-mail"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Phone size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Téléphone"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.inputContainer}>
            <MapPin size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Adresse postale"
              placeholderTextColor="#94A3B8"
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe (min. 6 caractères)"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>S'inscrire</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ?</Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginLink}> Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: Platform.OS === 'ios' ? 40 : 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B4332',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  roleSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleCard: {
    flex: 0.48,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  roleCardActive: {
    borderColor: '#2D6A4F',
    backgroundColor: '#F0FDF4',
  },
  roleRadio: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleRadioActive: {
    borderColor: '#2D6A4F',
    backgroundColor: '#2D6A4F',
  },
  roleEmoji: {
    fontSize: 32,
    marginBottom: 8,
    marginTop: 4,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  roleDesc: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#F8FAFC',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#0F172A',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  loginLink: {
    color: '#2D6A4F',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
