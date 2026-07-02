import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../constants/Config';
import { Star, ShieldAlert, CheckCircle, MessageSquare, X, Sprout } from 'lucide-react-native';

interface Order {
  id: number;
  quantity: number;
  totalPrice: number;
  status: string; // 'PENDING', 'PAID', 'DELIVERED', 'CANCELLED'
  paymentIntentId: string;
  createdAt: string;
  product: {
    id: number;
    name: string;
    unit: string;
    price: number;
    farmer: {
      fullName: string;
    };
  };
}

export default function ConsumerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Formulaire d'avis
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedOrders, setReviewedOrders] = useState<number[]>([]); // Liste des IDs de commandes évaluées

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/orders/consumer`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
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

  const handleOpenReview = (productId: number, orderId: number) => {
    setSelectedProductId(productId);
    setRating(5);
    setComment('');
    setReviewModalVisible(true);
  };

  const submitReview = async () => {
    if (!selectedProductId || !user) return;
    
    setSubmittingReview(true);
    try {
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          productId: selectedProductId,
          rating,
          comment
        })
      });

      if (response.ok) {
        Alert.alert("Merci !", "Votre avis a été soumis avec succès.");
        setReviewModalVisible(false);
        // On pourrait marquer la commande comme évaluée localement pour désactiver le bouton
        if (selectedProductId) {
          // Trouver l'ID de commande correspondant et le sauvegarder
          const order = orders.find(o => o.product.id === selectedProductId);
          if (order) {
            setReviewedOrders(prev => [...prev, order.id]);
          }
        }
      } else {
        const errMsg = await response.text();
        throw new Error(errMsg || "Impossible d'envoyer l'avis");
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Une erreur s'est produite.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAID':
        return styles.statusPaid;
      case 'DELIVERED':
        return styles.statusDelivered;
      case 'CANCELLED':
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'En cours de préparation';
      case 'DELIVERED':
        return 'Livrée';
      case 'CANCELLED':
        return 'Annulée';
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
          <Sprout size={50} color="#64748B" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>Vous n'avez pas encore passé de commande.</Text>
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
                <Text style={[styles.statusText, getStatusStyle(item.status)]}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>

              <Text style={styles.productName}>{item.product.name}</Text>
              <Text style={styles.farmerName}>Producteur : {item.product.farmer.fullName}</Text>
              
              <View style={styles.detailsRow}>
                <Text style={styles.qtyText}>
                  Quantité : {item.quantity} {item.product.unit}(s)
                </Text>
                <Text style={styles.totalPrice}>
                  {item.totalPrice.toFixed(2)} FCFA
                </Text>
              </View>

              {/* Si la commande est livrée, proposer de l'évaluer */}
              {item.status === 'DELIVERED' && !reviewedOrders.includes(item.id) && (
                <TouchableOpacity 
                  style={styles.reviewButton}
                  onPress={() => handleOpenReview(item.product.id, item.id)}
                >
                  <MessageSquare size={16} color="#2D6A4F" style={{ marginRight: 6 }} />
                  <Text style={styles.reviewButtonText}>Évaluer ce produit</Text>
                </TouchableOpacity>
              )}

              {reviewedOrders.includes(item.id) && (
                <View style={styles.reviewedLabel}>
                  <CheckCircle size={16} color="#475569" style={{ marginRight: 6 }} />
                  <Text style={styles.reviewedText}>Avis partagé avec succès</Text>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Modal pour soumettre un avis */}
      <Modal
        visible={reviewModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Évaluer le produit</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Note étoiles */}
            <Text style={styles.ratingLabel}>Votre note générale :</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Star 
                    size={32} 
                    color={star <= rating ? "#FFB020" : "#E2E8F0"} 
                    fill={star <= rating ? "#FFB020" : "transparent"} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Commentaire */}
            <Text style={styles.commentLabel}>Votre commentaire :</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Qu'avez-vous pensé de la fraîcheur, du goût ou de la livraison ?"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
            />

            <TouchableOpacity 
              style={styles.submitReviewBtn} 
              onPress={submitReview}
              disabled={submittingReview}
            >
              {submittingReview ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitReviewBtnText}>Soumettre mon avis</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    padding: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusPending: {
    color: '#D97706',
  },
  statusPaid: {
    color: '#2563EB',
  },
  statusDelivered: {
    color: '#16A34A',
  },
  statusCancelled: {
    color: '#DC2626',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B4332',
    marginTop: 4,
  },
  farmerName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  qtyText: {
    fontSize: 13,
    color: '#475569',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  reviewButtonText: {
    color: '#2D6A4F',
    fontWeight: 'bold',
    fontSize: 13,
  },
  reviewedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  reviewedText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B4332',
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  commentLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    height: 90,
    textAlignVertical: 'top',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    fontSize: 13,
    marginBottom: 16,
  },
  submitReviewBtn: {
    backgroundColor: '#2D6A4F',
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitReviewBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
