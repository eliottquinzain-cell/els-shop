/**
 * ELS.SHOP - API des Produits 1:1 avec Stockage Persistant GitHub
 * Synchronisation instantanée entre la Vitrine et le Back-Office Admin
 */

const { getProducts, saveProducts } = require('./lib/storage');
const { requireAdmin } = require('./lib/auth');

// Catalogue de démonstration 1:1 de secours
const DEMO_PRODUCTS = [
  {
    id: "els-001",
    name: "Alcatraz Pullover Hoodie",
    brand: "Corteiz",
    category: "sweats",
    price: 110,
    costPrice: 38,
    condition: "Neuf (1:1)",
    conditionGrade: "1:1 Miroir",
    color: "Triple Black",
    colors: ["Triple Black", "Gris Chiné", "Baby Blue"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    stock: { "XS": 2, "S": 4, "M": 8, "L": 6, "XL": 3, "XXL": 2 },
    badge: "TOP 1:1",
    featured: true,
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    description: "Qualité 1:1 haute fidélité. Coton lourd 450 GSM avec broderie relief Alcatraz identique. Étiquettes intérieures, wash tags et sachet zippé officiel fournis."
  },
  {
    id: "els-002",
    name: "Wyndham Parka Black Label",
    brand: "Canada Goose",
    category: "vestes",
    price: 320,
    costPrice: 110,
    condition: "Neuf avec étiquettes (1:1)",
    conditionGrade: "1:1 Miroir",
    color: "Noir Mat",
    colors: ["Noir Mat", "Gris Graphite", "Bleu Marine"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    stock: { "XS": 2, "S": 3, "M": 6, "L": 5, "XL": 3, "XXL": 2 },
    badge: "1:1 BEST-SELLER",
    featured: true,
    image: "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80",
    description: "Version 1:1 Miroir de la parka Wyndham. Tissu Arctic Tech® déperlant et coupe-vent, garnissage duvet d'oie thermique haute isolation. Écusson Black Label brodé au millimètre sur le bras gauche, zips métalliques YKK® étanches double sens, fourrure de capuche amovible et hologramme d'authenticité intérieur 1:1."
  },
  {
    id: "els-003",
    name: "Beta LT Jacket GORE-TEX",
    brand: "Arc'teryx",
    category: "vestes",
    price: 195,
    costPrice: 65,
    condition: "Neuf avec étiquettes (1:1)",
    conditionGrade: "1:1 Miroir",
    color: "Black Sapphire",
    colors: ["Black Sapphire", "Gris Forêt", "Bleu Cobalt"],
    sizes: ["S", "M", "L", "XL"],
    stock: { "S": 3, "M": 6, "L": 4, "XL": 2 },
    badge: "TECHWEAR 1:1",
    featured: true,
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
    description: "Version 1:1 imperméable avec membrane technique déperlante et zips thermocollés étanches. Logo oiseau brodé haute définition."
  },
  {
    id: "els-004",
    name: "Air Jordan 1 Low x Travis Scott 'Reverse Mocha'",
    brand: "Jordan",
    category: "chaussures",
    price: 180,
    costPrice: 60,
    condition: "Neuf boîte complète (1:1)",
    conditionGrade: "1:1 Miroir",
    color: "Sail / Ridgerock",
    colors: ["Sail / Ridgerock", "Black Phantom"],
    sizes: ["40", "41", "42", "42.5", "43", "44", "45"],
    stock: { "40": 2, "41": 3, "42": 6, "42.5": 4, "43": 5, "44": 3, "45": 2 },
    badge: "1:1 SNEAKER",
    featured: true,
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
    description: "Batch 1:1 premium. Cuir suédé véritable, nubuck réactif, swoosh inversé aux finitions nettes. Livrée avec boîte spéciale et 4 paires de lacets Cactus Jack."
  },
  {
    id: "els-005",
    name: "8-Ball Mohair Knit Sweater",
    brand: "Stüssy",
    category: "sweats",
    price: 125,
    costPrice: 42,
    condition: "Neuf (1:1)",
    conditionGrade: "1:1 Miroir",
    color: "Black / Natural",
    colors: ["Black / Natural", "White / Navy"],
    sizes: ["S", "M", "L", "XL"],
    stock: { "S": 3, "M": 5, "L": 5, "XL": 2 },
    badge: "BEST-SELLER",
    featured: true,
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80",
    description: "Tricot en mohair brossé haute fidélité 1:1. Motif 8-Ball centré au dos, toucher ultra doux sans bouloche. Étiquettes de col et de lavage conformes."
  }
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { searchParams } = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const category = searchParams.get('category');
  const brand = searchParams.get('brand');
  const id = searchParams.get('id');
  const action = searchParams.get('action');

  // ==========================================
  // GET: Consultation du catalogue (Public & Admin)
  // ==========================================
  if (req.method === 'GET') {
    let allProducts = await getProducts();

    if (id) {
      const product = allProducts.find(p => p.id === id);
      if (!product) {
        return res.status(404).json({ success: false, error: 'Article introuvable' });
      }
      return res.status(200).json({ success: true, product });
    }

    let filtered = [...allProducts];

    if (category && category !== 'all') {
      const catLower = category.toLowerCase();
      filtered = filtered.filter(p => {
        const pCat = (p.category || '').toLowerCase();
        if (catLower === 'chaussures' || catLower === 'sneakers') {
          return pCat === 'chaussures' || pCat === 'sneakers';
        }
        return pCat === catLower;
      });
    }

    if (brand && brand !== 'all') {
      filtered = filtered.filter(p => (p.brand || '').toLowerCase() === brand.toLowerCase());
    }

    const uniqueBrands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort();

    return res.status(200).json({
      success: true,
      count: filtered.length,
      brands: uniqueBrands,
      products: filtered
    });
  }

  // ==========================================
  // MUTATIONS (POST, PUT, DELETE) -> Requiert AUTH ADMIN
  // ==========================================
  const admin = requireAdmin(req);
  if (!admin) {
    return res.status(401).json({
      success: false,
      error: 'Accès refusé. Veuillez vous connecter avec le compte Eliott ou Ilies.'
    });
  }

  // Action: Réinitialiser vers les produits de démo
  if (req.method === 'POST' && action === 'reset_demo') {
    try {
      await saveProducts(DEMO_PRODUCTS, admin.displayName);
      return res.status(200).json({
        success: true,
        message: 'Catalogue réinitialisé avec les pièces démo 1:1.',
        products: DEMO_PRODUCTS
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // POST: Créer et publier un nouveau produit
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body || '{}');

      const { name, brand, category, price, costPrice, image, description, sizes, stock, conditionGrade, badge, color, colors } = body;

      if (!name || !price) {
        return res.status(400).json({ success: false, error: 'Nom et prix de vente obligatoires' });
      }

      let allProducts = await getProducts();
      const newId = 'els-' + (allProducts.length + 1).toString().padStart(3, '0');

      const sizeArr = Array.isArray(sizes) && sizes.length > 0 ? sizes : ["S", "M", "L", "XL"];
      const stockObj = stock || {};
      sizeArr.forEach(s => {
        if (stockObj[s] === undefined) stockObj[s] = 3;
      });

      const colorsArr = Array.isArray(colors) && colors.length > 0 
        ? colors 
        : (color ? [color] : ['Noir']);
      const defaultColor = color || colorsArr[0] || 'Noir';

      const newProduct = {
        id: newId,
        name,
        brand: (brand || 'Marque Streetwear').trim(),
        category: category || 'sweats',
        price: Number(price),
        costPrice: Number(costPrice || Math.round(Number(price) * 0.35)),
        condition: 'Neuf (1:1)',
        conditionGrade: conditionGrade || '1:1 Miroir',
        color: defaultColor,
        colors: colorsArr,
        sizes: sizeArr,
        stock: stockObj,
        badge: badge || 'NOUVEAU 1:1',
        featured: body.featured === true,
        image: image || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
        description: description || 'Qualité 1:1 supérieure avec finitions et étiquettes identiques.',
        createdAt: new Date().toISOString(),
        createdBy: admin.displayName
      };

      allProducts.unshift(newProduct);
      await saveProducts(allProducts, admin.displayName);

      return res.status(201).json({
        success: true,
        message: `Produit "${name}" publié par ${admin.displayName} !`,
        product: newProduct
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // PUT: Mettre à jour un produit ou ses stocks
  if (req.method === 'PUT') {
    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body || '{}');

      const prodId = body.id || id;
      if (!prodId) {
        return res.status(400).json({ success: false, error: 'ID produit manquant' });
      }

      let allProducts = await getProducts();
      const idx = allProducts.findIndex(p => p.id === prodId);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Article introuvable' });
      }

      allProducts[idx] = {
        ...allProducts[idx],
        ...body,
        id: prodId,
        updatedAt: new Date().toISOString(),
        updatedBy: admin.displayName
      };

      await saveProducts(allProducts, admin.displayName);

      return res.status(200).json({
        success: true,
        message: 'Produit mis à jour avec succès !',
        product: allProducts[idx]
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // DELETE: Supprimer un produit
  if (req.method === 'DELETE') {
    const prodId = id || (req.body && req.body.id);
    if (!prodId) {
      return res.status(400).json({ success: false, error: 'ID produit requis pour la suppression' });
    }

    try {
      let allProducts = await getProducts();
      const initialCount = allProducts.length;
      allProducts = allProducts.filter(p => p.id !== prodId);

      if (allProducts.length === initialCount) {
        return res.status(404).json({ success: false, error: 'Article introuvable' });
      }

      await saveProducts(allProducts, admin.displayName);

      return res.status(200).json({
        success: true,
        message: `Article supprimé avec succès par ${admin.displayName} !`,
        count: allProducts.length
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
};
