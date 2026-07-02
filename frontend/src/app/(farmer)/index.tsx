import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../constants/Config';
import { Trash2, Edit2, Package, Tag, Layers, Sprout } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
  quantity: number;
  imageUrl: string;
  category: string;
}

export default function FarmerDashboard() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchMyProducts = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/products/my`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMyProducts();
  };

  const handleDelete = (id: number) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm("Voulez-vous vraiment supprimer ce produit ? Cette action est irréversible.");
      if (confirmed) {
        performDelete(id);
      }
    } else {
      Alert.alert(
        "Supprimer le produit ?",
        "Cette action est irréversible et retirera le produit du marché.",
        [
          { text: "Annuler", style: "cancel" },
          { 
            text: "Supprimer", 
            style: "destructive", 
            onPress: () => performDelete(id)
          }
        ]
      );
    }
  };

  const performDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
        if (Platform.OS === 'web') {
          alert("Produit supprimé avec succès.");
        } else {
          Alert.alert("Succès", "Produit supprimé avec succès.");
        }
      } else if (response.status === 401) {
        logout();
      } else {
        throw new Error("Erreur de suppression");
      }
    } catch (err) {
      if (Platform.OS === 'web') {
        alert("Impossible de supprimer le produit.");
      } else {
        Alert.alert("Erreur", "Impossible de supprimer le produit.");
      }
    }
  };

  const handleEdit = (product: Product) => {
    router.push({
      pathname: '/(farmer)/add-product',
      params: { 
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        unit: product.unit,
        quantity: product.quantity.toString(),
        imageUrl: product.imageUrl,
        category: product.category,
        latitude: user?.latitude?.toString() || '0',
        longitude: user?.longitude?.toString() || '0'
      }
    });
  };

  const totalStock = products.reduce((acc, p) => acc + p.quantity, 0);
  const outOfStockCount = products.filter(p => p.quantity === 0).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête avec statistiques */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Layers size={24} color="#2D6A4F" />
          <Text style={styles.statNumber}>{products.length}</Text>
          <Text style={styles.statLabel}>Annonces actives</Text>
        </View>

        <View style={styles.statCard}>
          <Package size={24} color="#E9C46A" />
          <Text style={styles.statNumber}>{totalStock}</Text>
          <Text style={styles.statLabel}>Unités en stock</Text>
        </View>

        <View style={styles.statCard}>
          <Trash2 size={24} color="#EF4444" />
          <Text style={styles.statNumber}>{outOfStockCount}</Text>
          <Text style={styles.statLabel}>Ruptures de stock</Text>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Mes Produits</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Text style={styles.refreshLink}>Actualiser</Text>
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Sprout size={50} color="#64748B" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>Vous n'avez pas encore publié de produit.</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => router.push('/(farmer)/add-product')}
          >
            <Text style={styles.emptyButtonText}>Créer ma première annonce</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#2D6A4F"]} />
          }
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <Image 
                source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500' }} 
                style={styles.productImage} 
              />
              <View style={styles.productDetails}>
                <View style={styles.badgeRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category || 'Général'}</Text>
                  </View>
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>Publié sur le marché</Text>
                  </View>
                </View>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>{item.price} FCFA / {item.unit}</Text>
                
                <View style={styles.stockRow}>
                  <Text style={[styles.productStock, item.quantity === 0 && styles.outOfStock]}>
                    Stock: {item.quantity} {item.unit}(s)
                  </Text>
                </View>
              </View>

              <View style={styles.actionColumn}>
                <TouchableOpacity style={styles.actionButtonEdit} onPress={() => handleEdit(item)}>
                  <Edit2 size={16} color="#2D6A4F" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButtonDelete} onPress={() => handleDelete(item.id)}>
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 0.31,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B4332',
  },
  refreshLink: {
    color: '#2D6A4F',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 40,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  productImage: {
    width: 90,
    height: 100,
    backgroundColor: '#F1F5F9',
  },
  productDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  categoryBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  productName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  productPrice: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  productStock: {
    fontSize: 12,
    color: '#2D6A4F',
    fontWeight: '600',
  },
  outOfStock: {
    color: '#EF4444',
  },
  actionColumn: {
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#F1F5F9',
  },
  actionButtonEdit: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },
  actionButtonDelete: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
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
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  liveBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    borderWidth: 0.5,
    borderColor: '#86EFAC',
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#15803D',
  },
});
