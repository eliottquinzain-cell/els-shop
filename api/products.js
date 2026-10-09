/**
 * ELS.SHOP - Catalogue des pièces streetwear & sneakers Qualité 1:1
 * Avec gestion des coûts fournisseurs, marges et stocks
 */

let PRODUCTS = [
  {
    id: "els-001",
    name: "Alcatraz Pullover Hoodie",
    brand: "Corteiz",
    category: "sweats",
    price: 110,
    costPrice: 38,
    condition: "Neuf sous blister (1:1)",
    conditionGrade: "1:1 Miroir",
    color: "Triple Black",
    sizes: ["S", "M", "L", "XL"],
    stock: { "S": 4, "M": 8, "L": 6, "XL": 3 },
    badge: "TOP 1:1",
    featured: true,
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    description: "Qualité 1:1 haute précision. Coton lourd 450 GSM avec broderie relief Alcatraz identique. Étiquettes intérieures, wash tags et sachet zippé officiel fournis."
  },
  {
    id: "els-002",
    name: "8-Ball Mohair Knit Sweater",
    brand: "Stüssy",
    category: "sweats",
    price: 125,
    costPrice: 42,
    condition: "Neuf (1:1)",
    conditionGrade: "1:1 Miroir",
    color: "Black / Natural",
    sizes: ["M", "L"],
    stock: { "M": 5, "L": 5 },
    badge: "BEST-SELLER",
    featured: true,
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80",
    description: "Tricot en mohair brossé haute fidélité 1:1. Motif 8-Ball centré au dos, toucher ultra doux sans bouloche. Étiquettes de col et de lavage conformes."
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
    sizes: ["S", "M", "L"],
    stock: { "S": 3, "M": 6, "L": 4 },
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
    sizes: ["41", "42", "42.5", "43", "44"],
    stock: { "41": 2, "42": 5, "42.5": 3, "43": 4, "44": 2 },
    badge: "1:1 SNEAKER",
    featured: true,
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
    description: "Batch 1:1 premium. Cuir suédé véritable, nubuck réactif, swoosh inversé aux finitions nettes. Livrée avec boîte spéciale et 4 paires de lacets Cactus Jack."
  },
  {
    id: "els-005",
    name: "Box Logo Crewneck FW23",
    brand: "Supreme",
    category: "sweats",
    price: 120,
    costPrice: 40,
    condition: "Neuf sous blister (1:1)",
    conditionGrade: "1:1 Miroir",
    color: "Ash Grey / Red Bogo",
    sizes: ["M", "L", "XL"],
    stock: { "M": 4, "L": 6, "XL": 2 },
    badge: "ESSENTIEL",
    featured: false,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    description: "Polaire épaisse brossée avec Box Logo brodé grain croisé 1:1. Étiquette rouge au col et mini étiquette tissée sur la couture latérale."
  },
  {
    id: "els-006",
    name: "Wait Web Rhinestone Hoodie",
    brand: "Sp5der",
    category: "sweats",
    price: 130,
    costPrice: 45,
    condition: "Neuf (1:1)",
    conditionGrade: "1:1 Miroir",
    color: "Hot Pink / Strass",
    sizes: ["S", "M", "L"],
    stock: { "S": 2, "M": 4, "L": 3 },
    badge: "TREND 1:1",
    featured: false,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    description: "Motif toile d'araignée en strass thermocollés haute brillance 1:1. Coupe oversize streetwear, sérigraphie feutrine épaisse."
  },
  {
    id: "els-007",
    name: "Decoded Hooded Puffer 2.0",
    brand: "Trapstar",
    category: "vestes",
    price: 165,
    costPrice: 55,
    condition: "Neuf avec étiquette (1:1)",
    conditionGrade: "1:1 Miroir",
    color: "Black Gradient",
    sizes: ["M", "L"],
    stock: { "M": 3, "L": 4 },
    badge: "HIVER",
    featured: false,
    image: "https://images.unsplash.com/photo-1539533018447-63fcce667823?auto=format&fit=crop&w=800&q=80",
    description: "Doudoune matelassée épaisse 1:1 avec lettrage gothique Trapstar brodé au dos. Fermeture zippée métallique et tirettes gravées."
  },
  {
    id: "els-008",
    name: "Dunk Low Retro 'Panda'",
    brand: "Nike",
    category: "chaussures",
    price: 85,
    costPrice: 30,
    condition: "Neuf en boîte (1:1)",
    conditionGrade: "1:1 Miroir",
    color: "White / Black",
    sizes: ["40", "41", "42", "43", "44", "45"],
    stock: { "40": 2, "41": 3, "42": 6, "43": 5, "44": 3, "45": 2 },
    badge: "BEST SELLER",
    featured: false,
    image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=80",
    description: "Qualité 1:1 cuir souple grainé bicolore. Semelle cupsole cousue, étiquette languette et boîte carton officielle."
  },
  {
    id: "els-009",
    name: "Guerillaz Cargo Pants",
    brand: "Corteiz",
    category: "pantalons",
    price: 95,
    costPrice: 32,
    condition: "Neuf (1:1)",
    conditionGrade: "1:1 Miroir",
    color: "Forest Green",
    sizes: ["S", "M", "L"],
    stock: { "S": 3, "M": 5, "L": 4 },
    badge: "DRILL",
    featured: false,
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
    description: "Cargo ripstop militaire avec poches tactiques à soufflet. Broderie étoile jaune Corteiz sur la cuisse et cordons de serrage."
  },
  {
    id: "els-010",
    name: "Brainwave Vintage Heavy Tee",
    brand: "Hellstar",
    category: "t-shirts",
    price: 65,
    costPrice: 20,
    condition: "Neuf (1:1)",
    conditionGrade: "1:1 Miroir",
    color: "Washed Charcoal",
    sizes: ["M", "L"],
    stock: { "M": 5, "L": 6 },
    badge: "VINTAGE",
    featured: false,
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
    description: "T-shirt 100% coton lourd 260 GSM vintage wash 1:1. Sérigraphie haute résistance et finitions vieillies."
  },
  {
    id: "els-011",
    name: "1977 Core Collection Hoodie",
    brand: "Essentials",
    category: "sweats",
    price: 90,
    costPrice: 30,
    condition: "Neuf (1:1)",
    conditionGrade: "1:1 Miroir",
    color: "Iron Dark Grey",
    sizes: ["S", "M", "L", "XL"],
    stock: { "S": 3, "M": 6, "L": 5, "XL": 2 },
    badge: "MINIMAL",
    featured: false,
    image: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80",
    description: "Hoodie oversize coupe boxy 1:1. Écusson en caoutchouc souple sur la capuche et lettrage 1977 floqué feutrine sur le torse."
  },
  {
    id: "els-012",
    name: "Bird Head Toque Beanie",
    brand: "Arc'teryx",
    category: "accessoires",
    price: 45,
    costPrice: 15,
    condition: "Neuf avec étiquette (1:1)",
    conditionGrade: "1:1 Miroir",
    color: "Orca / Black & White",
    sizes: ["Taille Unique"],
    stock: { "Taille Unique": 12 },
    badge: "ACCESSOIRE",
    featured: false,
    image: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=800&q=80",
    description: "Bonnet en maille jacquard 1:1 avec grand oiseau Arc'teryx tissé. Doublure polaire interne douce et respirante."
  }
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { searchParams } = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const category = searchParams.get('category');
  const brand = searchParams.get('brand');
  const id = searchParams.get('id');

  // ==========================================
  // GET: Single product or filtered list
  // ==========================================
  if (req.method === 'GET') {
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
        const pCat = (p.category || '').toLowerCase();
        if (catLower === 'chaussures' || catLower === 'sneakers') {
          return pCat === 'chaussures' || pCat === 'sneakers';
        }
        return pCat === catLower;
      });
    }

    if (brand && brand !== 'all') {
      filtered = filtered.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
    }

    // Attach totalStock and profit margin info
    filtered = filtered.map(p => {
      const totalUnits = Object.values(p.stock || {}).reduce((a, b) => a + Number(b), 0);
      const unitMargin = (p.price || 0) - (p.costPrice || 0);
      const marginPercent = p.price ? Math.round((unitMargin / p.price) * 100) : 0;
      return {
        ...p,
        totalStock: totalUnits,
        unitMargin,
        marginPercent
      };
    });

    return res.status(200).json({
      success: true,
      count: filtered.length,
      products: filtered
    });
  }

  // ==========================================
  // POST: Add new product (Admin)
  // ==========================================
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body || '{}');

      const { name, brand, category, price, costPrice, image, description, sizes, stock, conditionGrade } = body;

      if (!name || !price) {
        return res.status(400).json({ success: false, error: 'Nom et prix obligatoires' });
      }

      const newId = 'els-' + String(PRODUCTS.length + 1).padStart(3, '0');
      const sizeArr = Array.isArray(sizes) && sizes.length > 0 ? sizes : ["S", "M", "L", "XL"];
      const stockObj = stock || {};
      
      sizeArr.forEach(s => {
        if (stockObj[s] === undefined) stockObj[s] = 5;
      });

      const newProduct = {
        id: newId,
        name,
        brand: brand || 'ELS',
        category: category || 'sweats',
        price: Number(price),
        costPrice: Number(costPrice || Math.round(Number(price) * 0.35)),
        condition: 'Neuf (1:1)',
        conditionGrade: conditionGrade || '1:1 Miroir',
        color: body.color || 'Noir',
        sizes: sizeArr,
        stock: stockObj,
        badge: body.badge || 'NOUVEAU 1:1',
        featured: body.featured === true,
        image: image || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
        description: description || 'Qualité 1:1 supérieure avec finitions et détails identiques.'
      };

      PRODUCTS.unshift(newProduct);

      return res.status(201).json({
        success: true,
        message: 'Produit publié avec succès sur ELS.SHOP !',
        product: newProduct
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // ==========================================
  // PUT: Update product or stock (Admin)
  // ==========================================
  if (req.method === 'PUT') {
    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body || '{}');
      const prodId = body.id || id;

      const idx = PRODUCTS.findIndex(p => p.id === prodId);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Produit introuvable' });
      }

      PRODUCTS[idx] = {
        ...PRODUCTS[idx],
        ...body,
        id: prodId
      };

      return res.status(200).json({
        success: true,
        message: 'Produit et stocks mis à jour !',
        product: PRODUCTS[idx]
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // ==========================================
  // DELETE: Delete product (Admin)
  // ==========================================
  if (req.method === 'DELETE') {
    const prodId = id;
    if (!prodId) {
      return res.status(400).json({ success: false, error: 'ID produit requis' });
    }
    PRODUCTS = PRODUCTS.filter(p => p.id !== prodId);
    return res.status(200).json({ success: true, message: 'Article supprimé du catalogue' });
  }

  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
};
