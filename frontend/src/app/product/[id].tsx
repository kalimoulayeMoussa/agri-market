import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../constants/Config';
import { ArrowLeft, Star, ShoppingCart, MapPin, Phone, User, MessageSquare, Plus, Minus, Navigation } from 'lucide-react-native';

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
    phone: string;
    address: string;
  };
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  reviewer: {
    fullName: string;
  };
}

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { addToCart, cartItems } = useCart();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const fetchDetails = async () => {
    try {
      // 1. Charger le produit
      const prodRes = await fetch(`${API_URL}/products/public/${id}`);
      if (!prodRes.ok) throw new Error("Produit non trouvé");
      const prodData = await prodRes.json();
      setProduct(prodData);

      // 2. Charger les avis
      const revRes = await fetch(`${API_URL}/reviews/product/${id}`);
      if (revRes.ok) {
        const revData = await revRes.json();
        setReviews(revData);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de charger les détails du produit.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart(product, quantity);
    Alert.alert(
      "Panier mis à jour",
      `${quantity} ${product.unit}(s) de ${product.name} ajouté(s) au panier !`,
      [
        { 
          text: "Continuer mes achats", 
          style: "cancel",
          onPress: () => router.back()
        },
        { text: "Voir le panier", onPress: () => router.push('/(consumer)/cart') }
      ]
    );
  };

  // Calculer la distance locale (Formule Haversine)
  const getDistance = () => {
    if (!user?.latitude || !user?.longitude || !product) return null;
    const lat1 = user.latitude;
    const lon1 = user.longitude;
    const lat2 = product.latitude;
    const lon2 = product.longitude;

    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (product.longitude - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const incrementQty = () => {
    if (!product) return;
    if (quantity < product.quantity) {
      setQuantity(prev => prev + 1);
    } else {
      Alert.alert("Limite de stock", "Vous ne pouvez pas commander plus que le stock disponible.");
    }
  };

  const decrementQty = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  if (!product) return null;

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const dist = getDistance();

  return (
    <View style={styles.container}>
      {/* En-tête de page personnalisé */}
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Grande image produit */}
        <Image 
          source={{ uri: product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800' }} 
          style={styles.productImage} 
        />

        <View style={styles.infoCard}>
          {/* Tag de catégorie et évaluation moyenne */}
          <View style={styles.metaRow}>
            <Text style={styles.categoryBadge}>{product.category}</Text>
            {averageRating && (
              <View style={styles.ratingBadge}>
                <Star size={14} color="#FFB020" fill="#FFB020" style={{ marginRight: 4 }} />
                <Text style={styles.ratingText}>{averageRating} ({reviews.length} avis)</Text>
              </View>
            )}
          </View>

          {/* Titre et prix */}
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>{product.price.toFixed(2)} FCFA <Text style={styles.unitText}>/ {product.unit}</Text></Text>
          
          <Text style={product.quantity === 0 ? styles.outOfStock : styles.inStock}>
            {product.quantity === 0 
              ? "Rupture de stock" 
              : `En stock : ${product.quantity} ${product.unit}(s) restant(s)`}
          </Text>

          {cartItems.find(c => c.product.id === product.id) && (
            <View style={styles.cartIndicator}>
              <Text style={styles.cartIndicatorText}>
                🛒 Déjà {cartItems.find(c => c.product.id === product.id)?.quantity} {product.unit}(s) dans votre panier
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Localisation et Producteur */}
          <Text style={styles.sectionTitle}>Producteur & Origine</Text>
          <View style={styles.producerCard}>
            <View style={styles.producerHeader}>
              <User size={18} color="#2D6A4F" style={{ marginRight: 8 }} />
              <Text style={styles.producerName}>{product.farmer.fullName}</Text>
            </View>
            
            <View style={styles.producerInfoRow}>
              <Phone size={14} color="#64748B" style={styles.infoIcon} />
              <Text style={styles.producerInfoText}>{product.farmer.phone || "Non spécifié"}</Text>
            </View>

            <View style={styles.producerInfoRow}>
              <MapPin size={14} color="#64748B" style={styles.infoIcon} />
              <Text style={styles.producerInfoText}>{product.farmer.address}</Text>
            </View>

            {dist !== null && (
              <View style={styles.distanceBanner}>
                <Navigation size={14} color="#2D6A4F" style={{ marginRight: 6 }} />
                <Text style={styles.distanceBannerText}>
                  Situé à seulement <Text style={{ fontWeight: 'bold' }}>{dist.toFixed(1)} km</Text> de votre position actuelle.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Description */}
          {product.description && (
            <>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
              <View style={styles.divider} />
            </>
          )}

          {/* Commentaires et Avis */}
          <Text style={styles.sectionTitle}>Avis des consommateurs</Text>
          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>Aucun avis pour le moment. Soyez le premier à évaluer ce produit !</Text>
          ) : (
            reviews.map((rev) => (
              <View key={rev.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{rev.reviewer.fullName}</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={12} 
                        color={star <= rev.rating ? "#FFB020" : "#E2E8F0"} 
                        fill={star <= rev.rating ? "#FFB020" : "transparent"} 
                      />
                    ))}
                  </View>
                </View>
                {rev.comment && <Text style={styles.reviewComment}>{rev.comment}</Text>}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Barre d'action d'achat en bas */}
      {product.quantity > 0 && (
        <View style={styles.actionFooter}>
          <View style={styles.qtySelector}>
            <TouchableOpacity style={styles.qtyBtn} onPress={decrementQty}>
              <Minus size={16} color="#475569" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={incrementQty}>
              <Plus size={16} color="#475569" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
            <ShoppingCart size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.addToCartText}>
              Ajouter - {(product.price * quantity).toFixed(2)} FCFA
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

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
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: Platform.OS === 'ios' ? 95 : 60,
    paddingTop: Platform.OS === 'ios' ? 45 : 0,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B4332',
    maxWidth: '65%',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  productImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F1F5F9',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    padding: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2D6A4F',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  productPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D6A4F',
    marginTop: 6,
  },
  unitText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: 'normal',
  },
  inStock: {
    fontSize: 12,
    color: '#2D6A4F',
    fontWeight: 'bold',
    marginTop: 6,
  },
  outOfStock: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: 'bold',
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B4332',
    marginBottom: 10,
  },
  producerCard: {
    backgroundColor: '#FAF9F6',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  producerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  producerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  producerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  infoIcon: {
    marginRight: 6,
  },
  producerInfoText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  distanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  distanceBannerText: {
    fontSize: 11,
    color: '#2D6A4F',
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  noReviews: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: '#FAF9F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  starsRow: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 13,
    color: '#334155',
    marginTop: 6,
    lineHeight: 18,
  },
  actionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 4,
    backgroundColor: '#FAF9F6',
  },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginHorizontal: 12,
  },
  addToCartBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.9,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cartIndicator: {
    backgroundColor: '#EFF6FF',
    borderWidth: 0.5,
    borderColor: '#93C5FD',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  cartIndicatorText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
