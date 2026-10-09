/**
 * ELS.SHOP - Générateur Intelligent de Descriptions Streetwear 1:1
 * Rédige des fiches produits détaillées, percutantes et conformes aux finitions 1:1
 */

const KNOWLEDGE_BASE = {
  corteiz: {
    materials: "Coton lourd premium 450 à 500 GSM, tissage ultra dense et intérieur molletonné brossé.",
    finishes: "Broderie relief Alcatraz ou impression haute densité, tirettes et cordons épais conformes.",
    packaging: "Livré sous sachet zippé officiel Corteiz RTW avec étiquettes de col et wash tags 1:1.",
    fitAdvice: "Coupe streetwear boxy. Prenez votre taille habituelle pour un tombé parfait."
  },
  "arc'teryx": {
    materials: "Tissu technique déperlant 3 couches effet GORE-TEX, coutures étanches thermocollées WaterTight™.",
    finishes: "Logo oiseau fossile brodé avec une précision millimétrique, zips étanches et cordons de serrage capuche.",
    packaging: "Fourni avec toutes les étiquettes cartonnées officielles et codes SKU conformes 1:1.",
    fitAdvice: "Coupe technique ajustée avec aisance pour superposition. Taille standard recommandée."
  },
  stüssy: {
    materials: "Maille mohair brossée douce et duveteuse (pour les mailles) ou coton épais 350 GSM.",
    finishes: "Motifs emblématiques (8-Ball, lettrage vintage) tissés en intarsia ou sérigraphiés sans bavure.",
    packaging: "Étiquette tissée noire classique au col et étiquette de composition intérieure fidèle 1:1.",
    fitAdvice: "Coupe relax streetwear décontractée, idéale pour un look décontracté."
  },
  jordan: {
    materials: "Cuir pleine fleur souple combiné à du nubuck et suède réactif haut de gamme.",
    finishes: "Swoosh inversé ou classique aux coutures régulières, broderies talon Cactus Jack / Wings nettes.",
    packaging: "Boîte complète spéciale, papiers de soie imprimés et jeux de lacets supplémentaires inclus.",
    fitAdvice: "Pointure standard (True to size). Prenez votre pointure Nike habituelle."
  },
  trapstar: {
    materials: "Nylon mat résistant aux intempéries avec garnissage isolant thermique haute densité.",
    finishes: "Lettrage gothique Decoded brodé en relief sur le dos et la capuche amovible.",
    packaging: "Sachet protecteur Trapstar avec zip métallique personnalisé et étiquettes scellées 1:1.",
    fitAdvice: "Coupe ajustée. Prenez une taille au-dessus si vous souhaitez porter un hoodie épais en dessous."
  },
  supreme: {
    materials: "Polaire épaisse lourd grain croisé (Heavyweight Crossgrain) 100% coton.",
    finishes: "Box Logo brodé au millimètre avec densité de points maximale, mini étiquette tissée latérale.",
    packaging: "Emballage individuel scellé avec étiquettes d'origine.",
    fitAdvice: "Coupe ample streetwear vintage authentique."
  },
  sp5der: {
    materials: "Coton molletonné épais avec finition douce au toucher.",
    finishes: "Toile d'araignée en strass thermocollés haute résistance à la lumière et lettrage en relief.",
    packaging: "Sachet zippé et étiquettes imprimées conformes 1:1.",
    fitAdvice: "Coupe oversize américaine moderne."
  },
  essentials: {
    materials: "Molleton épuré ultra doux avec tombé lourd caractéristique de Fear of God.",
    finishes: "Patch en silicone caoutchouté sur la capuche et lettrage en feutrine floqué sur la poitrine.",
    packaging: "Sachet scellé zip mat opaque Essentials avec étiquettes carton épaisses.",
    fitAdvice: "Coupe oversize généreuse. Possibilité de downsize si vous préférez un rendu plus ajusté."
  }
};

function generateDescriptionText({ name, brand, category, color, grade }) {
  const brandKey = (brand || '').toLowerCase().trim();
  const brandData = KNOWLEDGE_BASE[brandKey] || {
    materials: "Textile sélectionné haute densité avec matières premières premium.",
    finishes: "Coutures doublées, broderies nettes et finitions conformes aux standards les plus stricts.",
    packaging: "Livré sous emballage protecteur avec étiquettes complètes.",
    fitAdvice: "Prenez votre taille habituelle."
  };

  const articleName = name || 'Article Streetwear';
  const qualityGrade = grade || 'Qualité 1:1 Miroir';
  const colorText = color ? `en coloris ${color}` : '';

  return `Pièce exceptionnelle **${articleName}** ${colorText}, confectionnée en **${qualityGrade}** avec un niveau d'exigence et de fidélité absolu.

🔹 **Matières & Conception :** ${brandData.materials}
🔹 **Détails & Finitions 1:1 :** ${brandData.finishes}
🔹 **Packaging & Accessoires :** ${brandData.packaging}
🔹 **Conseil Taille :** ${brandData.fitAdvice}

⚠️ *Mention ELS.SHOP : Ce produit est une pièce en Qualité 1:1 Miroir (finitions, coupes, étiquettes et matériaux identiques au modèle original).*`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée. Utilisez POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    const { name, brand, category, color, grade } = body || {};

    if (!name && !brand) {
      return res.status(400).json({ success: false, error: 'Veuillez au moins indiquer le nom et la marque du produit.' });
    }

    const description = generateDescriptionText({ name, brand, category, color, grade });

    return res.status(200).json({
      success: true,
      description,
      suggestedBadge: '1:1 MIROIR',
      metadata: {
        brand: brand || 'Générique',
        qualityGrade: grade || '1:1 Miroir'
      }
    });

  } catch (error) {
    console.error('AI Generator error:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de la génération de la description.' });
  }
};
