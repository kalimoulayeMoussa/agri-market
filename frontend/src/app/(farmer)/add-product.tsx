import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Platform, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API_URL, PRODUCT_CATEGORIES, PRODUCT_CATALOG } from '../../constants/Config';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Save, AlertCircle, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const CATEGORY_IMAGES: { [key: string]: string } = {
  'Cultures vivrières': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600',
  'Cultures maraîchères': 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=600',
  'Cultures fruitières': 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=600',
  'Cultures de rente': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
  'Légumineuses': 'https://images.unsplash.com/photo-1547050062-51a84f3c0512?w=600',
  'Oléagineux': 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=600',
  'Épices & Plantes aromatiques': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600',
  'Plantes médicinales': 'https://images.unsplash.com/photo-1512428813824-f7253df4e167?w=600',
  'Produits de l\'élevage': 'https://images.unsplash.com/photo-1534080391025-09795d197a5b?w=600',
  'Produits forestiers non ligneux': 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=600',
  'Produits transformés': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600',
};

export default function AddOrEditProduct() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Mode Édition si un ID est passé en paramètre
  const isEditing = !!params.id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission requise", "Désolé, nous avons besoin des permissions d'accès à la galerie pour ajouter une photo !");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          setImageUrl(`data:image/jpeg;base64,${asset.base64}`);
        } else {
          setImageUrl(asset.uri);
        }
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de lire la photo de votre galerie.");
    }
  };

  useEffect(() => {
    if (isEditing) {
      setName(params.name as string || '');
      setDescription(params.description as string || '');
      setPrice(params.price as string || '');
      setUnit(params.unit as string || 'kg');
      setQuantity(params.quantity as string || '');
      setCategory(params.category as string || PRODUCT_CATEGORIES[0]);
      setImageUrl(params.imageUrl as string || '');
    } else {
      // Réinitialiser le formulaire
      setName('');
      setDescription('');
      setPrice('');
      setUnit('kg');
      setQuantity('');
      setCategory(PRODUCT_CATEGORIES[0]);
      setImageUrl('');
    }
  }, [params.id, params.name, params.description, params.price, params.unit, params.quantity, params.category, params.imageUrl, isEditing]);

  const handleSubmit = async () => {
    if (!name || !price || !quantity || !unit) {
      Alert.alert("Champs requis", "Veuillez renseigner au moins le nom, le prix, la quantité et l'unité.");
      return;
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert("Prix invalide", "Le prix doit être un nombre positif.");
      return;
    }

    if (isNaN(parseInt(quantity)) || parseInt(quantity) < 0) {
      Alert.alert("Stock invalide", "Le stock doit être un nombre positif ou nul.");
      return;
    }

    setSubmitting(true);
    
    // Associer une image correspondante à la catégorie si aucune URL n'est fournie
    const finalImageUrl = imageUrl.trim() || CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Autres'];

    try {
      const url = isEditing ? `${API_URL}/products/${params.id}` : `${API_URL}/products`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          unit,
          quantity: parseInt(quantity),
          imageUrl: finalImageUrl,
          category,
          latitude: user?.latitude || 12.3714, // Utiliser la localisation de l'agriculteur
          longitude: user?.longitude || -1.5197
        })
      });

      if (response.ok) {
        if (isEditing) {
          Alert.alert(
            "Succès",
            "Votre annonce a été mise à jour !",
            [{ text: "OK", onPress: () => router.replace('/(farmer)') }]
          );
        } else {
          Alert.alert(
            "Produit publié !",
            `Le produit "${name}" a été ajouté avec succès dans la catégorie "${category}".`,
            [
              {
                text: "Ajouter un autre",
                onPress: () => {
                  // Vider le formulaire pour en ajouter un autre immédiatement
                  setName('');
                  setDescription('');
                  setPrice('');
                  setUnit('kg');
                  setQuantity('');
                  setCategory(PRODUCT_CATEGORIES[0]);
                  setImageUrl('');
                }
              },
              {
                text: "Voir mes produits",
                onPress: () => {
                  router.replace('/(farmer)');
                }
              }
            ]
          );
        }
      } else {
        const errorMsg = await response.text();
        throw new Error(errorMsg || "Impossible de sauvegarder le produit.");
      }
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Une erreur s'est produite lors de la publication.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>
        {isEditing ? "Modifier l'annonce" : "Nouvelle annonce"}
      </Text>
      <Text style={styles.subtitle}>
        {isEditing ? "Ajustez les détails de votre produit" : "Renseignez les informations de vos produits agricoles pour les consommateurs"}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nom du produit *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Pommes de terre bio, Miel de fleurs..."
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Catégorie *</Text>
        <View style={styles.categoriesContainer}>
          {PRODUCT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Choix rapide de sous-produits cliquables */}
        <Text style={styles.subLabel}>Sélectionnez un produit ou saisissez le nom ci-dessus :</Text>
        <View style={styles.subItemsContainer}>
          {PRODUCT_CATALOG[category]?.map((subItem) => (
            <TouchableOpacity
              key={subItem}
              style={[styles.subItemChip, name === subItem && styles.subItemChipActive]}
              onPress={() => setName(subItem)}
            >
              <Text style={[styles.subItemChipText, name === subItem && styles.subItemChipTextActive]}>
                {subItem}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={[styles.column, { marginRight: 12 }]}>
            <Text style={styles.label}>Prix (FCFA) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 2.50"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>

          <View style={styles.column}>
            <Text style={styles.label}>Unité de vente *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: kg, botte, pièce"
              value={unit}
              onChangeText={setUnit}
            />
          </View>
        </View>

        <Text style={styles.label}>Quantité en stock *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 50"
          keyboardType="numeric"
          value={quantity}
          onChangeText={setQuantity}
        />

        <Text style={styles.label}>Image du produit</Text>
        
        {imageUrl ? (
          <View key="image-preview-wrapper" style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUrl('')}>
              <Text style={styles.removeImageBtnText}>Supprimer la photo</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.imagePickerRow}>
          <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
            <Upload size={18} color="#2D6A4F" style={{ marginRight: 8 }} />
            <Text style={styles.imagePickerBtnText}>Choisir depuis la galerie</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.orText}>Ou saisir un lien d'image direct (facultatif) :</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: https://images.unsplash.com/..."
          value={imageUrl.startsWith('data:') || imageUrl.startsWith('blob:') || imageUrl.startsWith('file:') ? '' : imageUrl}
          onChangeText={setImageUrl}
        />

        <View style={styles.infoBox}>
          <AlertCircle size={16} color="#475569" style={{ marginRight: 6 }} />
          <Text style={styles.infoText}>
            Si vous n'ajoutez pas d'image, une photo correspondant à la catégorie sera associée automatiquement.
          </Text>
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Décrivez votre produit, vos méthodes de culture (bio, raisonnée), etc."
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.submitButtonContent}>
              <Save size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>
                {isEditing ? "Enregistrer les modifications" : "Publier l'annonce"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B4332',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    fontSize: 14,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 0.48,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    marginTop: 4,
  },
  categoryChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 6,
  },
  categoryChipActive: {
    backgroundColor: '#2D6A4F',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#475569',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  removeImageBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imagePickerRow: {
    marginBottom: 12,
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#2D6A4F',
    borderStyle: 'dashed',
    borderRadius: 10,
    height: 48,
    backgroundColor: '#F0FDF4',
  },
  imagePickerBtnText: {
    color: '#2D6A4F',
    fontSize: 14,
    fontWeight: 'bold',
  },
  orText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
    marginTop: 4,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    marginTop: 10,
  },
  subItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  subItemChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subItemChipActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  subItemChipText: {
    fontSize: 12,
    color: '#475569',
  },
  subItemChipTextActive: {
    color: '#0284C7',
    fontWeight: 'bold',
  },
});
