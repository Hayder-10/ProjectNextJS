// Données de démonstration : utilisateurs, publications du forum avec réponses et likes,
// produits supplémentaires, tournois, commandes, réservations et XI.
// Lancer avec : npm run seed:demo (après npm run seed, et idéalement après npm run import:football).
// Ne fait rien si les utilisateurs de démo existent déjà.

import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Post from '../models/Post';
import Product from '../models/Product';
import Order from '../models/Order';
import Pitch from '../models/Pitch';
import Booking from '../models/Booking';
import Tournament from '../models/Tournament';
import Club from '../models/Club';
import Player from '../models/Player';
import MyTeam from '../models/MyTeam';

const DEMO_PASSWORD = 'Demo1234!';

const demoUsers = [
  { name: 'Yassine Ben Ali', email: 'yassine@foothub.tn', city: 'Tunis', club: 'Real Madrid' },
  { name: 'Amira Trabelsi', email: 'amira@foothub.tn', city: 'Sousse', club: 'FC Barcelona' },
  { name: 'Mehdi Jaziri', email: 'mehdi@foothub.tn', city: 'Sfax', club: 'Paris Saint-Germain' },
  { name: 'Salma Gharbi', email: 'salma@foothub.tn', city: 'Nabeul', club: 'Liverpool FC' },
  { name: 'Karim Bouazizi', email: 'karim@foothub.tn', city: 'Tunis', club: 'Juventus FC' },
];

// author / replies[].author / likes : index dans demoUsers
const posts = [
  {
    author: 0, category: 'match-talk', daysAgo: 1,
    title: 'Le Clasico de ce week-end : vos pronostics ?',
    content: 'Real Madrid contre Barça, le match de l\'année ! Je vois le Real gagner 2-1 avec un but de Mbappé en fin de match. Et vous ?',
    replies: [[1, 'Impossible, le Barça est en forme : 3-1 pour nous, Lamine Yamal va faire la différence 🔥'], [2, 'Match nul 1-1, les deux défenses sont solides cette saison.'], [0, '@Amira on en reparle dimanche soir 😄']],
    likes: [1, 2, 3, 4],
  },
  {
    author: 3, category: 'tactics', daysAgo: 2,
    title: '4-3-3 ou 4-4-2 pour un match de quartier en 7v7 ?',
    content: 'On joue chaque samedi au Soccer Park et on prend souvent des buts en contre. Vous conseillez quelle organisation pour du 7 contre 7 ? On a deux joueurs rapides devant.',
    replies: [[4, 'En 7v7 je conseille un 3-2-1 : trois derrière, deux au milieu, un pivot devant. Tes deux rapides sur les côtés du milieu.'], [0, 'Le plus important c\'est que le dernier défenseur ne monte jamais. Ça règle 80 % des contres.']],
    likes: [0, 4],
  },
  {
    author: 2, category: 'transfers', daysAgo: 3,
    title: 'Quel joueur tunisien peut signer dans un grand club européen ?',
    content: 'Avec la nouvelle génération des Aigles de Carthage, je pense qu\'un joueur peut franchir le cap cette saison. Qui voyez-vous partir en Ligue 1 ou en Liga ?',
    replies: [[1, 'Il faut surtout qu\'ils jouent régulièrement avant de viser trop haut. La Ligue 1 est un bon tremplin.'], [3, 'La Bundesliga recrute beaucoup de profils jeunes, ce serait parfait.']],
    likes: [0, 1, 3],
  },
  {
    author: 1, category: 'general', daysAgo: 4,
    title: 'Bienvenue sur FootHub ! Présentez-vous 👋',
    content: 'Nouveau forum, nouvelle communauté. Dites-nous d\'où vous venez, votre club préféré et votre poste quand vous jouez !',
    replies: [[0, 'Yassine, Tunis, madridista depuis toujours. Je joue milieu relayeur.'], [2, 'Mehdi de Sfax, fan du PSG, gardien le samedi matin 🧤'], [3, 'Salma de Nabeul, supportrice de Liverpool, ailière gauche !'], [4, 'Karim, Tunis, Juventus. Défenseur central, pas de quartier 😅']],
    likes: [0, 2, 3, 4],
  },
  {
    author: 4, category: 'match-talk', daysAgo: 5,
    title: 'Ligue des champions : qui pour la victoire finale ?',
    content: 'Après la phase de ligue, quels sont vos favoris ? Pour moi Arsenal a enfin l\'effectif pour aller au bout.',
    replies: [[0, 'Le Real, comme toujours en Ligue des champions. C\'est dans l\'ADN du club.'], [3, 'Liverpool si la défense tient !']],
    likes: [1, 3],
  },
  {
    author: 0, category: 'tactics', daysAgo: 6,
    title: 'Comment bien composer son Mon XI ?',
    content: 'Petit conseil : ne prenez pas que des attaquants chers. Un bon XI a un gardien solide et des latéraux qui marquent des passes décisives. Partagez vos compositions !',
    replies: [[2, 'Mon XI fait 1,2 milliard de valeur marchande, je ne regrette rien 😂']],
    likes: [2, 4],
  },
  {
    author: 2, category: 'general', daysAgo: 8,
    title: 'Cherche joueurs pour un five à Sfax le jeudi soir',
    content: 'On est 7, il nous manque 3 joueurs pour faire deux équipes de 5. Urban Foot Sfax, 20h-21h. Niveau détente, bonne ambiance garantie.',
    replies: [[4, 'Je viens de Tunis ce jeudi pour le travail, je peux dépanner !']],
    likes: [4],
  },
  {
    author: 3, category: 'transfers', daysAgo: 10,
    title: 'Le mercato d\'hiver : bonnes affaires ou paniques ?',
    content: 'Chaque janvier, les clubs dépensent beaucoup pour sauver leur saison. Vous pensez que les recrues d\'hiver réussissent vraiment ?',
    replies: [],
    likes: [],
  },
];

const extraProducts = [
  { name: 'Maillot CS Sfaxien 2025/26', description: 'Maillot domicile noir et blanc, tissu léger et respirant.', category: 'jerseys', price: 125.0, stock: 15 },
  { name: 'Maillot Étoile du Sahel 2025/26', description: 'Maillot rouge de l\'ESS, coupe classique, écusson brodé.', category: 'jerseys', price: 129.9, stock: 0 },
  { name: 'Gants de gardien Grip Pro', description: 'Paume en latex 4 mm, fermeture velcro, excellente adhérence par temps sec et humide.', category: 'accessories', price: 89.5, stock: 22 },
  { name: 'Ballon futsal taille 4', description: 'Rebond contrôlé, idéal pour la salle et les terrains de five.', category: 'balls', price: 75.0, stock: 30 },
  { name: 'Sac de sport FootHub', description: 'Compartiment chaussures séparé, 40 litres, bretelles rembourrées.', category: 'accessories', price: 69.9, stock: 25 },
  { name: 'Chasuble d\'entraînement (lot de 10)', description: 'Chasubles légères en filet, couleur jaune fluo, taille unique.', category: 'training', price: 55.0, stock: 12 },
  { name: 'Chaussures à crampons enfant', description: 'Crampons moulés, tige souple, du 28 au 38.', category: 'boots', price: 119.0, stock: 3 },
  { name: 'Gourde isotherme 750 ml', description: 'Garde l\'eau fraîche 12 heures, sans BPA.', category: 'accessories', price: 29.9, stock: 60 },
];

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysAgoDate(days: number, hour = 18) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** Championnat aller simple, comme startTournament */
function roundRobin(teams: string[], scores: ([number, number] | null)[]) {
  const matches = [];
  let k = 0;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const score = scores[k++] ?? null;
      matches.push({ homeTeam: teams[i], awayTeam: teams[j], round: 'Groupe', ...(score ? { homeScore: score[0], awayScore: score[1] } : {}) });
    }
  }
  return matches;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI manquant (fichier .env.local)');
  await mongoose.connect(uri);

  if (await User.exists({ email: demoUsers[0].email })) {
    console.log('Données de démo déjà présentes : rien à faire.');
    return mongoose.disconnect();
  }

  // 1. Utilisateurs (club favori si les données football sont importées)
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users: { _id: unknown }[] = [];
  for (const u of demoUsers) {
    const club = await Club.findOne({ name: u.club }).select('_id');
    users.push(await User.create({ name: u.name, email: u.email, city: u.city, passwordHash, favoriteClub: club?._id }));
  }
  const userId = (i: number) => users[i]._id as Types.ObjectId;
  console.log(`${users.length} utilisateurs créés (mot de passe : ${DEMO_PASSWORD})`);

  // 2. Forum : insertion directe pour garder des dates réalistes
  await Post.collection.insertMany(
    posts.map((p) => {
      const createdAt = daysAgoDate(p.daysAgo);
      return {
        author: userId(p.author),
        title: p.title,
        content: p.content,
        category: p.category,
        likes: p.likes.map(userId),
        replies: p.replies.map(([author, content], i) => ({
          _id: new Types.ObjectId(),
          author: userId(author as number),
          content,
          createdAt: new Date(createdAt.getTime() + (i + 1) * 3600 * 1000),
        })),
        createdAt,
        updatedAt: createdAt,
      };
    }),
  );
  console.log(`${posts.length} publications créées avec réponses et likes`);

  // 3. Produits supplémentaires (sans doublon de nom)
  let added = 0;
  for (const p of extraProducts) {
    if (!(await Product.exists({ name: p.name }))) {
      await Product.create(p);
      added++;
    }
  }
  console.log(`${added} produits ajoutés`);

  // 4. Commandes : prix copiés depuis la base et stock diminué, comme placeOrder
  const orderPlans = [
    { buyer: 0, items: [['Maillot équipe de Tunisie', 1], ['Ballon de match taille 5', 1]], status: 'shipped', address: 'Rue de Marseille 12, Tunis', phone: '+216 20 111 222', daysAgo: 9 },
    { buyer: 1, items: [['Chaussures futsal Indoor', 1]], status: 'confirmed', address: 'Avenue Léopold Senghor 5, Sousse', phone: '+216 22 333 444', daysAgo: 3 },
    { buyer: 2, items: [['Gants de gardien Grip Pro', 1], ['Gourde isotherme 750 ml', 2]], status: 'pending', address: 'Route de Tunis km 3, Sfax', phone: '+216 98 555 666', daysAgo: 1 },
  ] as const;
  for (const plan of orderPlans) {
    const items = [];
    for (const [name, quantity] of plan.items) {
      const product = await Product.findOne({ name });
      if (!product || product.stock < quantity) continue;
      await Product.updateOne({ _id: product._id }, { $inc: { stock: -quantity } });
      items.push({ product: product._id, name: product.name, price: product.price, quantity });
    }
    if (!items.length) continue;
    const total = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 1000) / 1000;
    const createdAt = daysAgoDate(plan.daysAgo, 14);
    await Order.collection.insertOne({
      buyer: userId(plan.buyer), items, total, status: plan.status,
      shippingAddress: plan.address, phone: plan.phone, createdAt, updatedAt: createdAt,
    });
  }
  console.log('Commandes créées');

  // 5. Réservations à venir
  const pitches = await Pitch.find({ isActive: true }).sort({ name: 1 });
  const bookingPlans = [
    { user: 0, pitch: 0, days: 1, hour: 19 },
    { user: 1, pitch: 1, days: 2, hour: 18 },
    { user: 2, pitch: 2, days: 3, hour: 20 },
    { user: 3, pitch: 0, days: 4, hour: 17 },
  ];
  let bookings = 0;
  for (const b of bookingPlans) {
    const pitch = pitches[b.pitch];
    if (!pitch || b.hour < pitch.openHour || b.hour >= pitch.closeHour) continue;
    await Booking.create({ pitch: pitch._id, user: userId(b.user), date: daysFromNow(b.days), startHour: b.hour, price: pitch.pricePerHour });
    bookings++;
  }
  console.log(`${bookings} réservations créées`);

  // 6. Tournois : un ouvert, un en cours, un terminé
  const finishedTeams = ['Les Aigles de Tunis', 'Sfax United', 'Sahel Stars', 'Cap Bon FC'];
  const ongoingTeams = ['Lac Strikers', 'Menzah City', 'Marsa Boys', 'Ariana Athletic'];
  await Tournament.create([
    {
      organizer: userId(0), name: 'Coupe du Lac 5v5', city: 'Tunis', pitch: pitches[0]?._id,
      description: 'Tournoi amical en 5 contre 5. Inscription gratuite, coupe pour les vainqueurs !',
      startDate: daysFromNow(17), maxTeams: 8, status: 'open',
      teams: [{ name: 'Les Aigles de Tunis', captain: userId(0) }, { name: 'Sahel Stars', captain: userId(1) }, { name: 'Sfax United', captain: userId(2) }],
      matches: [],
    },
    {
      organizer: userId(3), name: 'Trophée d\'automne', city: 'Tunis', pitch: pitches[1]?._id,
      description: 'Championnat sur trois samedis, chaque équipe rencontre toutes les autres.',
      startDate: daysFromNow(-4), maxTeams: 4, status: 'ongoing',
      teams: ongoingTeams.map((name, i) => ({ name, captain: userId(i + 1) })),
      matches: roundRobin(ongoingTeams, [[2, 1], [0, 0], [3, 2], null, null, null]),
    },
    {
      organizer: userId(1), name: 'Sousse Summer Cup', city: 'Sousse', pitch: pitches[2]?._id,
      description: 'L\'édition d\'été, terminée en beauté sous le soleil du Sahel.',
      startDate: daysFromNow(-60), maxTeams: 4, status: 'finished',
      teams: finishedTeams.map((name, i) => ({ name, captain: userId(i) })),
      matches: roundRobin(finishedTeams, [[3, 1], [2, 2], [4, 0], [1, 2], [2, 0], [1, 1]]),
    },
  ]);
  console.log('3 tournois créés');

  // 7. Un XI pour Yassine (seulement si les joueurs sont importés)
  const pick = async (position: string, count: number) =>
    Player.find({ position }).sort({ marketValueEur: -1 }).limit(count).select('_id');
  const [gk, def, mid, fwd] = await Promise.all([pick('GK', 1), pick('DEF', 4), pick('MID', 3), pick('FWD', 3)]);
  if (gk.length + def.length + mid.length + fwd.length === 11) {
    await MyTeam.create({
      owner: userId(0), name: 'Le XI le plus cher du monde', formation: '4-3-3', isPublic: true,
      players: [...gk, ...def, ...mid, ...fwd].map((p) => p._id),
    });
    console.log('1 XI créé');
  } else {
    console.log('Pas de XI : lancez d\'abord npm run import:football');
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Erreur :', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
