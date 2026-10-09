/**
 * ELS.SHOP - Catalogue des pièces streetwear authentifiées
 */

const PRODUCTS = [
  {
    id: "els-001",
    name: "Alcatraz Pullover Hoodie",
    brand: "Corteiz",
    category: "sweats",
    price: 175,
    retailPrice: 195,
    condition: "Neuf avec étiquette (DS)",
    conditionGrade: "10/10",
    color: "Triple Black",
    sizes: ["S", "M", "L", "XL"],
    badge: "DROP LIMITÉ",
    featured: true,
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80",
    description: "Le classique absolu de Clint 419. Coton lourd 450 GSM avec logo brodé Alcatraz en relief haute précision sur la poitrine. Vendu avec sachet zippé d'origine. Inspecté & certifié 100% conforme."
  },
  {
    id: "els-002",
    name: "8-Ball Mohair Knit Sweater",
    brand: "Stüssy",
    category: "sweats",
    price: 190,
    retailPrice: 220,
    condition: "Très bon état",
    conditionGrade: "9.5/10",
    color: "Black / Natural",
    sizes: ["M", "L"],
    badge: "COLLECTOR",
    featured: true,
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
    description: "Tricot en mohair brossé arborant l'iconique 8-Ball au dos. Texture ultra douce et coupe décontractée boxy fit. Aucune bouloche, pièce soigneusement conservée sur cintre plat."
  },
  {
    id: "els-003",
    name: "Beta LT Jacket GORE-TEX",
    brand: "Arc'teryx",
    category: "vestes",
    price: 385,
    retailPrice: 450,
    condition: "Neuf avec étiquettes",
    conditionGrade: "10/10",
    color: "Black Sapphire",
    sizes: ["S", "M", "L"],
    badge: "TECHWEAR ICON",
    featured: true,
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80",
    description: "Veste technique imperméable 3 couches GORE-TEX avec finitions zippées étanches WaterTight™. Logo fossile oiseau brodé sur la poitrine. Certifiée 100% authentique avec QR code vérifié."
  },
  {
    id: "els-004",
    name: "Air Jordan 1 Low x Travis Scott 'Reverse Mocha'",
    brand: "Jordan",
    category: "sneakers",
    price: 590,
    retailPrice: 850,
    condition: "Neuf en boîte originale",
    conditionGrade: "10/10 (DS)",
    color: "Sail / Ridgerock",
    sizes: ["41", "42", "42.5", "43", "44"],
    badge: "SAINTE GRAAL",
    featured: true,
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80",
    description: "Collaboration légendaire entre La Flame et le Jordan Brand. Swoosh inversé oversize, nubuck premium et détails Cactus Jack brodés au talon. Livrée avec les 4 paires de lacets et ticket d'achat d'origine."
  },
  {
    id: "els-005",
    name: "Box Logo Crewneck FW23",
    brand: "Supreme",
    category: "sweats",
    price: 240,
    retailPrice: 280,
    condition: "Neuf sous blister",
    conditionGrade: "10/10",
    color: "Ash Grey / Red Bogo",
    sizes: ["M", "L", "XL"],
    badge: "ESSENTIEL",
    featured: false,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
    description: "L'emblématique Box Logo brodé rouge sur polaire lourde grise chinée. Étiquettes intérieures contrôlées au millimètre par nos soins. Zéro défaut de couture."
  },
  {
    id: "els-006",
    name: "Wait Web Rhinestone Hoodie",
    brand: "Sp5der",
    category: "sweats",
    price: 215,
    retailPrice: 250,
    condition: "Comme neuf",
    conditionGrade: "9.8/10",
    color: "Hot Pink / Strass",
    sizes: ["S", "M", "L"],
    badge: "POPULAIRE",
    featured: false,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=800&q=80",
    description: "Design toile d'araignée intégrale en strass brillants par Young Thug. Lettrage Sp5der vibrant, coupe streetwear boxy. Authentifié par UV et contrôle de densité des strass."
  },
  {
    id: "els-007",
    name: "Decoded Hooded Puffer 2.0",
    brand: "Trapstar",
    category: "vestes",
    price: 255,
    retailPrice: 290,
    condition: "Neuf avec étiquette",
    conditionGrade: "10/10",
    color: "Black Gradient",
    sizes: ["M", "L"],
    badge: "HIVER",
    featured: false,
    image: "https://images.unsplash.com/photo-1539533018447-63fcce667823?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
    description: "Doudoune matelassée ultra chaude garnie de duvet synthétique haute densité. Logo brodé gothique Trapstar au dos et sur le rabat de capuche amovible. Pièce officielle certifiée."
  },
  {
    id: "els-008",
    name: "Dunk Low Retro 'Panda'",
    brand: "Nike",
    category: "sneakers",
    price: 120,
    retailPrice: 140,
    condition: "Neuf en boîte d'origine",
    conditionGrade: "10/10 (DS)",
    color: "White / Black",
    sizes: ["40", "41", "42", "43", "44", "45"],
    badge: "BEST SELLER",
    featured: false,
    image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
    description: "Le classique intemporel qui passe avec toutes vos tenues. Cuir bicolore souple noir et blanc, semelle cupsole confortable. Jamais essayée, boîte d'origine intacte."
  },
  {
    id: "els-009",
    name: "Guerillaz Cargo Pants",
    brand: "Corteiz",
    category: "pantalons",
    price: 165,
    retailPrice: 185,
    condition: "Très bon état",
    conditionGrade: "9.5/10",
    color: "Forest Green / Yellow Star",
    sizes: ["S", "M", "L"],
    badge: "DRILL VIBE",
    featured: false,
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=800&q=80",
    description: "Pantalon cargo ample ripstop militaire ultra résistant avec poches tactiques à soufflet. Étoile jaune Corteiz brodée sur la cuisse et cordons d'ajustement aux chevilles."
  },
  {
    id: "els-010",
    name: "Brainwave Vintage Heavy Tee",
    brand: "Hellstar",
    category: "t-shirts",
    price: 140,
    retailPrice: 170,
    condition: "Neuf",
    conditionGrade: "10/10",
    color: "Washed Charcoal",
    sizes: ["M", "L"],
    badge: "RARE",
    featured: false,
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    description: "Coton lavé vintage effet vieilli avec sérigraphie craquelée artisanale Hellstar. Écusson brodé de la capsule et puce NFC interne vérifiée sans défaut."
  },
  {
    id: "els-011",
    name: "1977 Core Collection Hoodie",
    brand: "Essentials",
    category: "sweats",
    price: 135,
    retailPrice: 155,
    condition: "Neuf sous emballage",
    conditionGrade: "10/10",
    color: "Iron Dark Grey",
    sizes: ["S", "M", "L", "XL"],
    badge: "MINIMALIST",
    featured: false,
    image: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    description: "Ligne épurée créée par Jerry Lorenzo. Écusson en caoutchouc 'Essentials Fear of God' sur la capuche et lettrage feutrine '1977' floqué sur le buste. Coupe oversize tombé lourd."
  },
  {
    id: "els-012",
    name: "Bird Head Toque Beanie",
    brand: "Arc'teryx",
    category: "accessoires",
    price: 68,
    retailPrice: 80,
    condition: "Neuf avec étiquette",
    conditionGrade: "10/10",
    color: "Orca / Black & White",
    sizes: ["Taille Unique"],
    badge: "ACCESSOIRE PHARE",
    featured: false,
    image: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=800&q=80",
    secondaryImage: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80",
    description: "Le bonnet culte en mélange laine mérinos et acrylique avec le grand logo oiseau tissé en intarsia. Bandeau intérieur en micropolaire respirant. Doux, chaud et authentifié."
  }
];

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { searchParams } = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const category = searchParams.get('category');
  const brand = searchParams.get('brand');
  const id = searchParams.get('id');

  if (id) {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Produit introuvable' });
    }
    return res.status(200).json({ success: true, product });
  }

  let filtered = [...PRODUCTS];

  if (category && category !== 'all') {
    const catLower = category.toLowerCase();
    filtered = filtered.filter(p => {
      const pCat = p.category.toLowerCase();
      if (catLower === 'chaussures' || catLower === 'sneakers') {
        return pCat === 'chaussures' || pCat === 'sneakers';
      }
      return pCat === catLower;
    });
  }

  if (brand && brand !== 'all') {
    filtered = filtered.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
  }

  return res.status(200).json({
    success: true,
    count: filtered.length,
    products: filtered
  });
};
