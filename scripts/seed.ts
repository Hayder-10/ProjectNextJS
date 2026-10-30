// Crée le compte admin, des produits et des terrains d'exemple.
// Lancer avec : npm run seed. Ne touche pas aux données football.

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Product from '../models/Product';
import Pitch from '../models/Pitch';

const products = [
  { name: 'Maillot Espérance de Tunis 2025/26', description: 'Maillot domicile rouge et jaune, coupe ajustée, tissu respirant.', category: 'jerseys', price: 139.9, stock: 25 },
  { name: 'Maillot Club Africain 2025/26', description: 'Maillot domicile rouge et blanc, édition supporters.', category: 'jerseys', price: 129.9, stock: 20 },
  { name: 'Maillot équipe de Tunisie', description: 'Maillot officiel des Aigles de Carthage, blanc.', category: 'jerseys', price: 159.0, stock: 30 },
  { name: 'Chaussures à crampons FG Pro', description: 'Crampons moulés pour terrain sec, tige en synthétique légère.', category: 'boots', price: 289.5, stock: 12 },
  { name: 'Chaussures futsal Indoor', description: 'Semelle gomme non marquante, idéale pour salle et gazon court.', category: 'boots', price: 179.0, stock: 15 },
  { name: 'Ballon de match taille 5', description: 'Ballon thermocollé, homologué pour les compétitions.', category: 'balls', price: 99.9, stock: 40 },
  { name: 'Kit d\'entraînement (10 plots + échelle)', description: 'Plots de couleur et échelle de rythme pour travailler la vitesse.', category: 'training', price: 65.5, stock: 18 },
  { name: 'Protège-tibias Junior/Senior', description: 'Coque légère avec chaussette de maintien.', category: 'accessories', price: 34.9, stock: 50 },
];

const pitches = [
  { name: 'Five Arena Lac 2', city: 'Tunis', address: 'Rue du Lac Windermere, Les Berges du Lac 2', type: '5v5', pricePerHour: 80, openHour: 9, closeHour: 24 },
  { name: 'Stade Municipal El Menzah', city: 'Tunis', address: 'Avenue Hédi Nouira, El Menzah 6', type: '11v11', pricePerHour: 250, openHour: 8, closeHour: 22 },
  { name: 'Soccer Park Sousse', city: 'Sousse', address: 'Route de la Corniche, Sousse', type: '7v7', pricePerHour: 120, openHour: 10, closeHour: 23 },
  { name: 'Urban Foot Sfax', city: 'Sfax', address: 'Route de Gremda km 4, Sfax', type: '5v5', pricePerHour: 70, openHour: 9, closeHour: 23 },
  { name: 'Complexe Sportif Nabeul', city: 'Nabeul', address: 'Avenue Habib Thameur, Nabeul', type: '7v7', pricePerHour: 100, openHour: 8, closeHour: 22 },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI manquant (fichier .env.local)');
  await mongoose.connect(uri);

  if (await User.exists({ email: 'admin@foothub.tn' })) {
    console.log('Admin déjà présent');
  } else {
    await User.create({
      name: 'Admin FootHub',
      email: 'admin@foothub.tn',
      passwordHash: await bcrypt.hash('Admin1234!', 10),
      role: 'admin',
      city: 'Tunis',
    });
    console.log('Admin créé : admin@foothub.tn / Admin1234!');
  }

  if ((await Product.countDocuments()) === 0) {
    await Product.insertMany(products);
    console.log(`${products.length} produits créés`);
  } else {
    console.log('Produits déjà présents');
  }

  if ((await Pitch.countDocuments()) === 0) {
    await Pitch.insertMany(pitches);
    console.log(`${pitches.length} terrains créés`);
  } else {
    console.log('Terrains déjà présents');
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Erreur :', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
