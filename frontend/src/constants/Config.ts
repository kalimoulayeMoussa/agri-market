// Configuration globale de l'application
export const API_URL = 'http://192.168.11.108:8080/api';

// Catalogue structuré des produits agricoles
export const PRODUCT_CATALOG: { [key: string]: string[] } = {
  'Cultures vivrières': [
    'Maïs', 'Riz', 'Mil', 'Sorgho', 'Fonio', 'Blé', 'Manioc', 'Igname', 'Patate douce', 'Pomme de terre'
  ],
  'Cultures maraîchères': [
    'Tomate', 'Oignon', 'Chou', 'Carotte', 'Laitue', 'Aubergine', 'Concombre', 'Gombo', 'Piment', 'Poivron'
  ],
  'Cultures fruitières': [
    'Mangue', 'Orange', 'Citron', 'Banane', 'Papaye', 'Ananas', 'Pastèque', 'Goyave', 'Avocat', 'Raisin'
  ],
  'Cultures de rente': [
    'Coton', 'Cacao', 'Café', 'Canne à sucre', 'Arachide', 'Sésame', 'Soja', 'Karité', 'Hévéa', 'Tabac'
  ],
  'Légumineuses': [
    'Haricot', 'Niébé', 'Pois', 'Lentille', 'Soja', 'Pois chiche'
  ],
  'Oléagineux': [
    'Arachide', 'Sésame', 'Tournesol', 'Soja', 'Palme à huile', 'Colza'
  ],
  'Épices & Plantes aromatiques': [
    'Gingembre', 'Ail', 'Oignon', 'Curcuma', 'Piment', 'Basilic', 'Persil', 'Menthe'
  ],
  'Plantes médicinales': [
    'Moringa', 'Neem', 'Aloe vera', 'Hibiscus (Bissap)', 'Citronnelle'
  ],
  'Produits de l\'élevage': [
    'Viande', 'Lait', 'Œufs', 'Miel', 'Poulet', 'Bœuf', 'Mouton', 'Chèvre'
  ],
  'Produits forestiers non ligneux': [
    'Karité', 'Néré (soumbala)', 'Baobab (feuilles et fruits)', 'Miel', 'Gomme arabique', 'Champignons'
  ],
  'Produits transformés': [
    'Farine de maïs', 'Farine de mil', 'Farine de manioc', 'Huile d\'arachide', 'Beurre de karité', 'Jus de bissap', 'Jus de gingembre', 'Confiture', 'Yaourt', 'Fromage'
  ]
};

export const PRODUCT_CATEGORIES = Object.keys(PRODUCT_CATALOG);
