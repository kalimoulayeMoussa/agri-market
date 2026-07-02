-- Création de la base de données
CREATE DATABASE IF NOT EXISTS agrimarket CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE agrimarket;

-- Table des utilisateurs (Agriculteurs et Consommateurs)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    latitude DOUBLE,
    longitude DOUBLE,
    role VARCHAR(20) NOT NULL, -- 'FARMER' ou 'CONSUMER'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Table des produits mis en vente par les agriculteurs
CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- Ex: 'kg', 'pièce', 'litre'
    quantity INT NOT NULL,
    image_url TEXT,
    category VARCHAR(50), -- Ex: 'Fruits', 'Légumes', 'Produits Laitiers', 'Viande'
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    farmer_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    consumer_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'DELIVERED', 'CANCELLED'
    payment_intent_id VARCHAR(100), -- ID de paiement fictif
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consumer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table des avis et évaluations
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
