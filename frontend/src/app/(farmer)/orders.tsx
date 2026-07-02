import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../constants/Config';
import { CheckCircle, Truck, Phone, MapPin, User, Mail, Package } from 'lucide-react-native';

interface Order {
  id: number;
  quantity: number;
  totalPrice: number;
  status: string; // 'PENDING', 'PAID', 'DELIVERED', 'CANCELLED'
  paymentIntentId: string;
  createdAt: string;
  consumer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
  product: {
    name: string;
    unit: string;
    price: number;
  };
}

export default function FarmerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/orders/farmer`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Trier les commandes par date de création décroissante
        setOrders(data.sort((a: any, b: any) => b.id - a.id));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleMarkAsDelivered = async (orderId: number) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/status?status=DELIVERED`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });

      if (response.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'DELIVERED' } : o));
        Alert.alert("Succès", "La commande a été marquée comme livrée.");
      } else {
        throw new Error("Erreur de modification de statut");
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'PAID':
        return styles.badgePaid;
      case 'DELIVERED':
        return styles.badgeDelivered;
      case 'CANCELLED':
        return styles.badgeCancelled;
      default:
        return styles.badgePending;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Payé - À livrer';
      case 'DELIVERED':
        return 'Livré';
      case 'CANCELLED':
        return 'Annulé';
      default:
        return 'En attente de paiement';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={50} color="#64748B" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>Aucune commande reçue pour le moment.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#2D6A4F"]} />
          }
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>Commande #{item.id}</Text>
                <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
                  <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>

              {/* Détails du produit commandé */}
              <View style={styles.productDetails}>
                <Text style={styles.productTitle}>
                  {item.product.name}
                </Text>
                <Text style={styles.productQty}>
                  Quantité : {item.quantity} {item.product.unit}(s) x {item.product.price} FCFA
                </Text>
                <Text style={styles.totalPrice}>
                  Total : {item.totalPrice.toFixed(2)} FCFA
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Infos Client */}
              <View style={styles.clientDetails}>
                <View style={styles.infoRow}>
                  <User size={16} color="#64748B" style={styles.infoIcon} />
                  <Text style={styles.infoText}>{item.consumer.fullName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Phone size={16} color="#64748B" style={styles.infoIcon} />
                  <Text style={styles.infoText}>{item.consumer.phone || "Non renseigné"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MapPin size={16} color="#64748B" style={styles.infoIcon} />
                  <Text style={styles.infoText}>{item.consumer.address}</Text>
                </View>
              </View>

              {/* Actions */}
              {item.status === 'PAID' && (
                <TouchableOpacity 
                  style={styles.deliverButton} 
                  onPress={() => handleMarkAsDelivered(item.id)}
                >
                  <Truck size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.deliverButtonText}>Marquer comme livrée</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF9F6',
  },
  emptyContainer: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgePaid: {
    backgroundColor: '#DBEAFE',
  },
  badgeDelivered: {
    backgroundColor: '#D1FAE5',
  },
  badgeCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  productDetails: {
    marginBottom: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B4332',
  },
  productQty: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  },
  totalPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D6A4F',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  clientDetails: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  deliverButton: {
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  deliverButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
