import { Tabs, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { LogOut, Home, PlusCircle, ClipboardList } from 'lucide-react-native';

export default function FarmerLayout() {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2D6A4F',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 80 : 65,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
        },
        headerTitleStyle: {
          color: '#1B4332',
          fontWeight: 'bold',
        },
        headerRight: () => (
          <TouchableOpacity 
            onPress={async () => {
              await logout();
              router.replace('/login');
            }} 
            style={styles.logoutButton}
          >
            <LogOut size={18} color="#EF4444" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mon Stand',
          tabBarLabel: 'Mon Stand',
          headerTitle: 'Mes Produits en Vente',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-product"
        options={{
          title: 'Ajouter',
          tabBarLabel: 'Ajouter',
          headerTitle: 'Publier un Produit',
          tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Ventes',
          tabBarLabel: 'Ventes',
          headerTitle: 'Commandes Reçues',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

import { Platform } from 'react-native';

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
});
