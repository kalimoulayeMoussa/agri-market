import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Switch, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API_URL, PRODUCT_CATEGORIES, PRODUCT_CATALOG } from '../../constants/Config';
import { useCart } from '../../context/CartContext';
import { Search, MapPin, Navigation, Tag, Sprout, ChevronDown, ChevronUp } from 'lucide-react-native';
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
  latitude: number;
  longitude: number;
  farmer: {
    fullName: string;
    address: string;
  };
}

export default function MarketplaceHome() {
  const { user, updateLocation } = useAuth();
  const { cartItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubProduct, setSelectedSubProduct] = useState<string | null>(null);
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [onlyNearby, setOnlyNearby] = useState(false);
  const [maxDistance, setMaxDistance] = useState(30); // 30 km par défaut

  const handleSelectCategory = (cat: string | null) => {
    setSelectedCategory(cat);
    setSelectedSubProduct(null); // Réinitialiser le sous-produit
  };
  
  const router = useRouter();

  const fetchProducts = async () => {
    try {
      let url = `${API_URL}/products/public`;
      
      // Si le filtre de proximité est activé et qu'on a les coordonnées de l'utilisateur
      if (onlyNearby && user?.latitude && user?.longitude) {
        url = `${API_URL}/products/public/nearby?latitude=${user.latitude}&longitude=${user.longitude}&maxDistance=${maxDistance}`;
      } else if (selectedCategory) {
        url = `${API_URL}/products/public/category?category=${encodeURIComponent(selectedCategory)}`;
      }

      const response = await fetch(url);
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
    fetchProducts();
  }, [selectedCategory, onlyNearby, user?.latitude]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onlyNearby) {
      try {
        await updateLocation();
      } catch (err) {
        console.log("Erreur de mise à jour de localisation", err);
      }
    }
    fetchProducts();
  };

  const handleSyncLocation = async () => {
    setLoading(true);
    try {
      const loc = await updateLocation();
      Alert.alert("Succès", `Localisation synchronisée : ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Impossible d'obtenir votre position.");
    } finally {
      setLoading(false);
    }
  };

  // Calculer la distance locale pour l'affichage en km (Formule Haversine)
  const getDistance = (prodLat: number, prodLon: number) => {
    if (!user?.latitude || !user?.longitude) return null;
    const lat1 = user.latitude;
    const lon1 = user.longitude;
    const lat2 = prodLat;
    const lon2 = prodLon;

    const R = 6371; // Kilomètres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (prodLon - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filtrer par recherche, catégorie et sous-produit cliquable
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.farmer.fullName.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesSubProduct = selectedSubProduct === null || p.name.toLowerCase() === selectedSubProduct.toLowerCase();
    const matchesCategory = selectedCategory === null || p.category === selectedCategory;

    return matchesSearch && matchesSubProduct && matchesCategory;
  });

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchBarContainer}>
        <Search size={18} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher des pommes, du miel, des œufs..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Bannière de localisation & Interrupteur de proximité */}
      <View style={styles.locationContainer}>
        <View style={styles.locationLeft}>
          <MapPin size={16} color="#2D6A4F" />
          <Text style={styles.locationText} numberOfLines={1}>
            {user?.latitude ? `Ma position : Activée` : "Position non configurée"}
          </Text>
        </View>
        <View style={styles.nearbyToggleRow}>
          <Text style={styles.toggleLabel}>Autour de moi</Text>
          <Switch
            value={onlyNearby}
            onValueChange={(val) => {
              if (val && (!user?.latitude || !user?.longitude)) {
                Alert.alert(
                  "Géolocalisation requise",
                  "Voulez-vous synchroniser votre position GPS ?",
                  [
                    { text: "Annuler", style: "cancel" },
                    { text: "Synchroniser", onPress: handleSyncLocation }
                  ]
                );
              } else {
                setOnlyNearby(val);
              }
            }}
            trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
            thumbColor={onlyNearby ? '#2D6A4F' : '#F1F5F9'}
          />
        </View>
      </View>

      {/* Catalogue Accordéon Repliable */}
      <View style={styles.catalogueContainer}>
        <TouchableOpacity 
          style={styles.catalogueHeader}
          onPress={() => setIsCatalogueOpen(!isCatalogueOpen)}
        >
          <View style={styles.catalogueHeaderLeft}>
            <Tag size={16} color="#2D6A4F" style={{ marginRight: 8 }} />
            <Text style={styles.catalogueHeaderTitle}>
              {selectedCategory 
                ? `${selectedCategory}${selectedSubProduct ? ` > ${selectedSubProduct}` : ''}`
                : "Parcourir le catalogue"}
            </Text>
          </View>
          {isCatalogueOpen ? <ChevronUp size={18} color="#2D6A4F" /> : <ChevronDown size={18} color="#2D6A4F" />}
        </TouchableOpacity>

        {isCatalogueOpen && (
          <ScrollView style={styles.catalogueBody} nestedScrollEnabled={true}>
            {/* Option Réinitialiser Filtre */}
            <TouchableOpacity 
              style={[styles.categoryRow, selectedCategory === null && styles.categoryRowSelected]}
              onPress={() => {
                handleSelectCategory(null);
                setIsCatalogueOpen(false);
              }}
            >
              <Text style={[styles.categoryRowText, selectedCategory === null && styles.categoryRowTextSelected]}>
                ✨ Tous les produits
              </Text>
            </TouchableOpacity>

            {PRODUCT_CATEGORIES.map((cat) => {
              const isCatExpanded = expandedCategory === cat;
              return (
                <View key={cat} style={styles.categoryBlock}>
                  <TouchableOpacity 
                    style={[styles.categoryRow, selectedCategory === cat && styles.categoryRowSelected]}
                    onPress={() => setExpandedCategory(isCatExpanded ? null : cat)}
                  >
                    <Text style={[styles.categoryRowText, selectedCategory === cat && styles.categoryRowTextSelected]}>
                      {isCatExpanded ? '▾' : '▸'} {cat}
                    </Text>
                  </TouchableOpacity>

                  {isCatExpanded && (
                    <View style={styles.subCatalogChipsContainer}>
                      <TouchableOpacity
                        style={[
                          styles.subCatalogChip, 
                          selectedCategory === cat && selectedSubProduct === null && styles.subCatalogChipActive
                        ]}
                        onPress={() => {
                          setSelectedCategory(cat);
                          setSelectedSubProduct(null);
                          setIsCatalogueOpen(false);
                        }}
                      >
                        <Text style={[
                          styles.subCatalogChipText,
                          selectedCategory === cat && selectedSubProduct === null && styles.subCatalogChipTextActive
                        ]}>
                          Tout {cat}
                        </Text>
                      </TouchableOpacity>
                      
                      {PRODUCT_CATALOG[cat]?.map((sub) => (
                        <TouchableOpacity
                          key={sub}
                          style={[
                            styles.subCatalogChip, 
                            selectedCategory === cat && selectedSubProduct === sub && styles.subCatalogChipActive
                          ]}
                          onPress={() => {
                            setSelectedCategory(cat);
                            setSelectedSubProduct(sub);
                            setIsCatalogueOpen(false);
                          }}
                        >
                          <Text style={[
                            styles.subCatalogChipText,
                            selectedCategory === cat && selectedSubProduct === sub && styles.subCatalogChipTextActive
                          ]}>
                            {sub}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2D6A4F" />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Sprout size={50} color="#64748B" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>Aucun produit ne correspond à votre recherche.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#2D6A4F"]} />
          }
          renderItem={({ item }) => {
            const dist = getDistance(item.latitude, item.longitude);
            const cartItem = cartItems.find(c => c.product.id === item.id);
            const qtyInCart = cartItem ? cartItem.quantity : 0;
            return (
              <TouchableOpacity 
                style={styles.productCard} 
                onPress={() => router.push(`/product/${item.id}`)}
              >
                <Image 
                  source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500' }} 
                  style={styles.productImage} 
                />
                <View style={styles.productInfo}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.categoryBadge}>{item.category}</Text>
                    {qtyInCart > 0 && (
                      <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>🛒 {qtyInCart}</Text>
                      </View>
                    )}
                    {dist !== null && (
                      <View style={styles.distanceBadge}>
                        <Navigation size={10} color="#2D6A4F" style={{ marginRight: 2 }} />
                        <Text style={styles.distanceText}>{dist.toFixed(1)} km</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.farmerName}>Par {item.farmer.fullName}</Text>
                  <Text style={styles.productPrice}>{item.price} FCFA / {item.unit}</Text>
                  
                  {item.quantity === 0 ? (
                    <Text style={styles.outOfStock}>Rupture de stock</Text>
                  ) : (
                    <Text style={styles.inStock}>En stock : {item.quantity} {item.unit}(s)</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

import { Alert } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#0F172A',
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.5,
  },
  locationText: {
    fontSize: 12,
    color: '#475569',
    marginLeft: 4,
    fontWeight: '500',
  },
  nearbyToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 11,
    color: '#475569',
    marginRight: 6,
    fontWeight: 'bold',
  },
  categoriesWrapper: {
    marginBottom: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#2D6A4F',
    borderColor: '#2D6A4F',
  },
  categoryText: {
    fontSize: 12,
    color: '#475569',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    flexDirection: 'row',
  },
  productImage: {
    width: 120,
    height: 130,
    backgroundColor: '#F1F5F9',
  },
  productInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2D6A4F',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distanceText: {
    fontSize: 9,
    color: '#2D6A4F',
    fontWeight: 'bold',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  farmerName: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D6A4F',
    marginTop: 6,
  },
  inStock: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
  },
  outOfStock: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: 'bold',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 0.7,
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
  catalogueContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  catalogueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
  },
  catalogueHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catalogueHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  catalogueBody: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    maxHeight: 350,
  },
  categoryBlock: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  categoryRowSelected: {
    backgroundColor: '#ECFDF5',
  },
  categoryRowText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  categoryRowTextSelected: {
    color: '#047857',
    fontWeight: 'bold',
  },
  subCatalogChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  subCatalogChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  subCatalogChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  subCatalogChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  subCatalogChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cartBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    borderWidth: 0.5,
    borderColor: '#93C5FD',
  },
  cartBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
});
