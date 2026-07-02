import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/Config';
import * as Location from 'expo-location';

interface UserSession {
  id: number;
  email: string;
  fullName: string;
  role: 'FARMER' | 'CONSUMER';
  token: string;
  latitude?: number;
  longitude?: number;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateLocation: () => Promise<{ latitude: number; longitude: number }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger la session stockée au démarrage
    const loadSession = async () => {
      try {
        const stored = await AsyncStorage.getItem('user_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          
          // Valider le token auprès du backend
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${parsed.token}` }
          });
          
          if (response.ok) {
            setUser(parsed);
          } else {
            // Si le token n'est pas valide (ex: base réinitialisée), on nettoie la session
            await AsyncStorage.removeItem('user_session');
            setUser(null);
          }
        }
      } catch (e) {
        console.error("Erreur lors du chargement de la session", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Identifiants incorrects");
      }

      const data = await response.json();
      const sessionData: UserSession = {
        id: data.id,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        token: data.token,
      };

      // Tenter d'obtenir la géolocalisation après connexion
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // Utilisation d'un timeout de 2 secondes pour éviter le blocage indéfini sur le navigateur
          const loc = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
          ]).catch(() => null);

          if (loc && typeof loc === 'object' && 'coords' in loc) {
            sessionData.latitude = loc.coords.latitude;
            sessionData.longitude = loc.coords.longitude;
            
            // Mettre à jour la localisation sur le serveur
            await fetch(`${API_URL}/auth/location?latitude=${loc.coords.latitude}&longitude=${loc.coords.longitude}`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${data.token}` }
            });
          }
        }
      } catch (err) {
        console.log("Géolocalisation refusée ou indisponible lors de la connexion", err);
      }

      setUser(sessionData);
      await AsyncStorage.setItem('user_session', JSON.stringify(sessionData));
    } catch (error: any) {
      throw new Error(error.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const register = async (regData: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Erreur lors de l'inscription");
      }
    } catch (error: any) {
      throw new Error(error.message || "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user_session');
  };

  const updateLocation = async () => {
    if (!user) throw new Error("Utilisateur non connecté");
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error("Permission de géolocalisation refusée");
      }

      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;

      const response = await fetch(`${API_URL}/auth/location?latitude=${lat}&longitude=${lon}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error("Impossible de synchroniser la localisation avec le serveur");
      }

      const updatedSession = { ...user, latitude: lat, longitude: lon };
      setUser(updatedSession);
      await AsyncStorage.setItem('user_session', JSON.stringify(updatedSession));
      
      return { latitude: lat, longitude: lon };
    } catch (error: any) {
      throw new Error(error.message || "Erreur de géolocalisation");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateLocation }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};
