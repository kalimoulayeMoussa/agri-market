import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../constants/Config';
import { Trash2, Plus, Minus, CreditCard, ShieldCheck, X, ShoppingCart } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ConsumerCart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // Formulaire de paiement
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'ORANGE_MONEY' | 'MOOV_MONEY' | 'TELECEL_MONEY'>('CARD');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setModalVisible(true);
  };

  const processPayment = async () => {
    if (paymentMethod === 'CARD') {
      if (!cardName || !cardNumber || !expiry || !cvv) {
        Alert.alert("Champs requis", "Veuillez remplir toutes les informations de paiement par carte.");
        return;
      }
      if (cardNumber.replace(/\s/g, '').length < 16) {
        Alert.alert("Carte invalide", "Le numéro de carte doit contenir 16 chiffres.");
        return;
      }
    } else {
      if (!phoneNumber || !otpCode) {
        Alert.alert("Champs requis", "Veuillez saisir votre numéro de téléphone et le code de validation (OTP).");
        return;
      }
      if (phoneNumber.replace(/\s/g, '').length < 8) {
        Alert.alert("Numéro invalide", "Le numéro de téléphone doit contenir au moins 8 chiffres.");
        return;
      }
    }

    setSubmitting(true);

    try {
      // Pour chaque article du panier, créer une commande puis la payer
      for (const item of cartItems) {
        // 1. Créer la commande
        const orderResponse = await fetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`
          },
          body: JSON.stringify({
            productId: item.product.id,
            quantity: item.quantity
          })
        });

        if (!orderResponse.ok) {
          const errMsg = await orderResponse.text();
          throw new Error(errMsg || `Échec de la commande pour ${item.product.name}`);
        }

        const orderData = await orderResponse.json();

        // 2. Procéder au paiement (envoie soit le numéro de carte, soit le numéro de téléphone précédé du type de paiement)
        const payValue = paymentMethod === 'CARD' 
          ? cardNumber.replace(/\s/g, '') 
          : `${paymentMethod}:${phoneNumber.replace(/\s/g, '')}`;

        const payResponse = await fetch(`${API_URL}/orders/${orderData.id}/pay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`
          },
          body: JSON.stringify({
            cardNumber: payValue
          })
        });

        if (!payResponse.ok) {
          const errMsg = await payResponse.text();
          throw new Error(errMsg || `Échec du paiement pour la commande #${orderData.id}`);
        }
      }

      // Vider le panier et fermer le modal
      clearCart();
      setModalVisible(false);
      
      // Réinitialiser le formulaire
      setCardName('');
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setPhoneNumber('');
      setOtpCode('');

      const payMethodLabel = paymentMethod === 'CARD' ? "carte bancaire" : paymentMethod.replace('_', ' ');
      Alert.alert(
        "Paiement réussi !",
        `Vos achats ont été validés et réglés avec succès via ${payMethodLabel}. Les agriculteurs en sont notifiés !`,
        [{ text: "Super !", onPress: () => router.push('/(consumer)/orders') }]
      );

    } catch (error: any) {
      Alert.alert("Erreur de paiement", error.message || "Impossible de finaliser la transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingCart size={50} color="#64748B" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>Votre panier est vide.</Text>
          <TouchableOpacity 
            style={styles.emptyButton} 
            onPress={() => router.push('/(consumer)')}
          >
            <Text style={styles.emptyButtonText}>Découvrir les produits locaux</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.product.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.cartCard}>
                <Image 
                  source={{ uri: item.product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500' }} 
                  style={styles.cartImage} 
                />
                <View style={styles.cartInfo}>
                  <Text style={styles.productName}>{item.product.name}</Text>
                  <Text style={styles.farmerName}>Par {item.product.farmer.fullName}</Text>
                  <Text style={styles.productPrice}>{item.product.price} FCFA / {item.product.unit}</Text>
                  
                  {/* Sélecteur de quantité */}
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity 
                      style={styles.quantityBtn}
                      onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Minus size={14} color="#475569" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity 
                      style={styles.quantityBtn}
                      onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      <Plus size={14} color="#475569" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.deleteBtn}
                  onPress={() => removeFromCart(item.product.id)}
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />

          {/* Sommaire du panier */}
          <View style={styles.summaryContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total du panier :</Text>
              <Text style={styles.totalValue}>{cartTotal.toFixed(2)} FCFA</Text>
            </View>
            
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <CreditCard size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.checkoutBtnText}>Passer au paiement sécurisé</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal de paiement sécurisé */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.secureHeader}>
                <ShieldCheck size={20} color="#2D6A4F" style={{ marginRight: 6 }} />
                <Text style={styles.modalTitle}>Paiement Sécurisé</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.totalToPay}>Total à régler : {cartTotal.toFixed(2)} FCFA</Text>
              
              <Text style={styles.sectionLabel}>Mode de paiement</Text>
              <View style={styles.methodContainer}>
                <TouchableOpacity 
                  style={[styles.methodCard, paymentMethod === 'CARD' && styles.methodCardActive]} 
                  onPress={() => setPaymentMethod('CARD')}
                >
                  <Image 
                    source={{ uri: 'https://img.icons8.com/color/48/visa.png' }} 
                    style={styles.methodLogo} 
                  />
                  <Text style={[styles.methodText, paymentMethod === 'CARD' && styles.methodTextActive]}>Carte</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.methodCard, paymentMethod === 'ORANGE_MONEY' && styles.methodCardActive]} 
                  onPress={() => setPaymentMethod('ORANGE_MONEY')}
                >
                  <Image 
                    source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/120px-Orange_logo.svg.png' }} 
                    style={styles.methodLogo} 
                  />
                  <Text style={[styles.methodText, paymentMethod === 'ORANGE_MONEY' && styles.methodTextActive]}>Orange</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.methodCard, paymentMethod === 'MOOV_MONEY' && styles.methodCardActive]} 
                  onPress={() => setPaymentMethod('MOOV_MONEY')}
                >
                  <Image 
                    source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Logo_Moov_Africa.png/240px-Logo_Moov_Africa.png' }} 
                    style={styles.methodLogo} 
                  />
                  <Text style={[styles.methodText, paymentMethod === 'MOOV_MONEY' && styles.methodTextActive]}>Moov</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.methodCard, paymentMethod === 'TELECEL_MONEY' && styles.methodCardActive]} 
                  onPress={() => setPaymentMethod('TELECEL_MONEY')}
                >
                  <Image 
                    source={{ uri: 'https://www.telecel.bf/wp-content/uploads/2021/04/cropped-logo-telecel-192x192.png' }} 
                    style={styles.methodLogo} 
                  />
                  <Text style={[styles.methodText, paymentMethod === 'TELECEL_MONEY' && styles.methodTextActive]}>Telecel</Text>
                </TouchableOpacity>
              </View>

              {paymentMethod === 'CARD' ? (
                <View key="card-fields">
                  <Text style={styles.inputLabel}>Titulaire de la carte</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Nom complet"
                    value={cardName}
                    onChangeText={setCardName}
                  />

                  <Text style={styles.inputLabel}>Numéro de carte</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="1234 5678 1234 5678"
                    keyboardType="numeric"
                    maxLength={19}
                    value={cardNumber}
                    onChangeText={(val) => {
                      // Formatage automatique du numéro de carte (ajoute des espaces tous les 4 chiffres)
                      const formatted = val.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
                      setCardNumber(formatted);
                    }}
                  />

                  <View style={styles.modalRow}>
                    <View style={[styles.modalCol, { marginRight: 12 }]}>
                      <Text style={styles.inputLabel}>Expiration</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="MM/AA"
                        maxLength={5}
                        value={expiry}
                        onChangeText={(val) => {
                          if (val.length === 2 && !val.includes('/')) {
                            setExpiry(val + '/');
                          } else {
                            setExpiry(val);
                          }
                        }}
                      />
                    </View>
                    <View style={styles.modalCol}>
                      <Text style={styles.inputLabel}>Cryptogramme (CVV)</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="123"
                        keyboardType="numeric"
                        secureTextEntry
                        maxLength={3}
                        value={cvv}
                        onChangeText={setCvv}
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <View key="mobile-fields">
                  <Text style={styles.inputLabel}>Numéro de téléphone {paymentMethod === 'ORANGE_MONEY' ? 'Orange' : paymentMethod === 'MOOV_MONEY' ? 'Moov' : 'Telecel'}</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Ex: 70 00 00 00"
                    keyboardType="phone-pad"
                    maxLength={15}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />

                  <Text style={styles.inputLabel}>Code de validation (OTP) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Saisissez le code de validation"
                    keyboardType="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChangeText={setOtpCode}
                  />
                  <Text style={styles.hintText}>
                    {paymentMethod === 'ORANGE_MONEY' && "Générez votre code OTP en composant le *144*4*6# sur votre téléphone."}
                    {paymentMethod === 'MOOV_MONEY' && "Validez la transaction via la notification de validation sur votre mobile."}
                    {paymentMethod === 'TELECEL_MONEY' && "Saisissez le code de sécurité envoyé par SMS."}
                  </Text>
                </View>
              )}

              <TouchableOpacity 
                style={styles.payBtn}
                onPress={processPayment}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.payBtnText}>Payer {cartTotal.toFixed(2)} FCFA</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.secureFooter}>
                🔒 Cryptage SSL fictif - Aucun frais réel ne sera débité.
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  emptyContainer: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
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
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    paddingRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    alignItems: 'center',
  },
  cartImage: {
    width: 80,
    height: 90,
    backgroundColor: '#F1F5F9',
  },
  cartInfo: {
    flex: 1,
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  farmerName: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    color: '#2D6A4F',
    fontWeight: 'bold',
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  deleteBtn: {
    padding: 10,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#475569',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  checkoutBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  secureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B4332',
  },
  modalForm: {
    paddingBottom: 20,
  },
  totalToPay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D6A4F',
    marginBottom: 16,
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 10,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    fontSize: 14,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCol: {
    flex: 0.48,
  },
  payBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secureFooter: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
    marginTop: 14,
  },
  methodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  methodCard: {
    flex: 0.23,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  methodCardActive: {
    borderColor: '#2D6A4F',
    backgroundColor: '#F0FDF4',
  },
  methodText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  methodTextActive: {
    color: '#2D6A4F',
    fontWeight: 'bold',
  },
  methodLogo: {
    width: 28,
    height: 18,
    resizeMode: 'contain',
  },
  hintText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 12,
  },
});
