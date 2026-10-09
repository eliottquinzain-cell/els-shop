/**
 * ELS.SHOP - Générateur Expert de Descriptions Streetwear 1:1
 * Rédige des fiches produits détaillées, luxueuses et ultra précises
 * avec analyse technique approfondie des coupes, matières, étiquettes et finitions 1:1.
 */

const EXPERT_KNOWLEDGE = {
  "canada goose": {
    heritage: "Référence mondiale du vêtement grand froid et icône du vestiaire streetwear premium.",
    materials: "Tissu extérieur Arctic Tech® ultra résistant, déperlant et coupe-vent, avec garnissage en duvet de canard blanc haute densité (indice thermique TEI 3 à 4).",
    finishes: "Disque polaire Canada Goose brodé au millimètre sur le bras avec feuilles d'érable et typographie parfaite. Zips métalliques YKK® double sens renforcés, rabat tempête coupe-vent avec boutons-pression gravés et poignets encastrés en tricot côtelé.",
    packaging: "Livrée avec toutes les étiquettes cartonnées officielles, hologramme de sécurité 1:1 réfléchissant cousu à l'intérieur, housse de protection zippée et cintre officiel.",
    fitAdvice: "Coupe Fusion Fit ou Regular. Prenez votre taille habituelle pour un tombé ajusté parfait, ou une taille au-dessus pour superposer un hoodie épais.",
    care: "Nettoyage à sec spécialisé recommandé pour préserver le gonflant naturel du duvet et la déperlance du tissu."
  },
  "moncler": {
    heritage: "Le sommet du luxe alpin réinterprété au cœur de la street culture mondiale.",
    materials: "Nylon laqué Longue Saison emblématique à l'effet brillant déperlant, garni de duvet d'oie 90/10 ultra léger offrant une isolation thermique exceptionnelle.",
    finishes: "Écusson iconique en feutrine brodé avec logo Moncler sur la poche de manche gauche. Fermeture à glissière injectée moulée sous pression, boutons-pression personnalisés et célèbre bande dessinée intérieure 'Monduck' cousue au fil blanc conforme.",
    packaging: "Fournie avec étiquette Certilogo 1:1 avec QR code, housse anti-poussière Moncler et étiquettes cartonnées d'origine.",
    fitAdvice: "Coupe classique italienne légèrement cintrée. Prenez une taille supérieure si vous êtes entre deux tailles.",
    care: "Lavage délicat à l'eau froide sur l'envers ou nettoyage professionnel."
  },
  "corteiz": {
    materials: "Coton lourd brossé haute densité 450 à 500 GSM (French Terry ultra épais), procurant un tombé lourd et une tenue irréprochable au fil des ports.",
    finishes: "Broderie en relief 3D haute définition du logo Alcatraz sur le torse, finitions de bord-côte renforcées aux poignets et à la taille, et cordons de serrage épais tubulaires avec embouts scellés.",
    packaging: "Livré sous son sachet protecteur zippé officiel Corteiz Rules The World (RTW) avec étiquette de col tissée jaune et noire et wash tags satinés conformes 1:1.",
    fitAdvice: "Coupe boxy streetwear authentique avec épaules légèrement tombantes (drop shoulders). Prenez votre taille habituelle pour un rendu streetwear parfait.",
    care: "Lavage en machine à 30°C sur l'envers, repassage doux à l'envers pour préserver les broderies."
  },
  "arc'teryx": {
    materials: "Membrane technique 3 couches GORE-TEX imperméable et respirante, avec apprêt déperlant durable DWR et micro-coutures étanchées thermocollées de 1,6 mm.",
    finishes: "Logo oiseau fossile brodé avec une précision laser sur la poitrine. Fermetures éclair étanches WaterTight™, capuche réglable StormHood™ compatible casque et cordons de serrage à l'ourlet avec bloqueurs encastrés.",
    packaging: "Livrée avec étiquettes cartonnées techniques GORE-TEX®, codes de style et SKU conformes 1:1.",
    fitAdvice: "Coupe technique ergonomique (Trim Fit). Taille standard recommandée, conçue pour accueillir une couche intermédiaire (polaire ou doudoune légère).",
    care: "Lavage régulier à 30°C avec détergent liquide doux et réactivation du déperlant au sèche-linge doux."
  },
  "trapstar": {
    materials: "Nylon indéchirable mat hydrofuge haute densité avec garnissage matelassé ultra chaud résistant aux intempéries.",
    finishes: "Typographie gothique signature Trapstar Decoded brodée en relief 3D au dos et sur la visière de la capuche détachable. Tirettes de zips personnalisées 'T' en métal lourd.",
    packaging: "Sachet zippé mat Trapstar London officiel avec étiquettes carton et ruban de sécurité 1:1.",
    fitAdvice: "Coupe cintrée près du corps. Prenez votre taille habituelle pour un porté fit, ou une taille au-dessus pour porter un sweat épais en dessous.",
    care: "Nettoyage en surface avec une éponge humide ou nettoyage à sec délicat."
  },
  "stüssy": {
    materials: "Maille tricotée en mohair brossé duveteuse et douce (pour les mailles) ou coton lourd 350 GSM peigné haute résistance.",
    finishes: "Motifs cultes (8-Ball, logo signature Shawn Stussy) tissés en intarsia nette ou sérigraphiés sans bavure. Coutures bord-à-bord renforcées.",
    packaging: "Étiquette tissée noire classique cousue au col et étiquette de composition intérieure fidèle 1:1.",
    fitAdvice: "Coupe relax décontractée d'inspiration skate californien. True to size.",
    care: "Lavage délicat à la main pour le mohair, séchage à plat sur serviette."
  },
  "jordan": {
    materials: "Combinaison de cuir pleine fleur souple grainé et de suède/nubuck véritable aux poils fins et réactifs au toucher.",
    finishes: "Swoosh inversé oversize impeccablement découpé et cousu, broderies talon Cactus Jack et Jordan Wings nettes et régulières. Semelle intermédiaire cupsole vieillie vintage cousue tout autour.",
    packaging: "Boîte complète exclusive, papier de soie monogrammé et 3 à 4 paires de lacets cirés supplémentaires.",
    fitAdvice: "Pointure standard (True to size). Prenez votre pointure habituelle de sneakers Nike / Jordan.",
    care: "Nettoyage avec produit spécial suède et brosse douce pour préserver la texture du nubuck."
  },
  "sp5der": {
    materials: "Coton polaire américain lourd ultra doux à l'intérieur, toucher moelleux et isolant.",
    finishes: "Toile d'araignée signature ornée de strass scintillants haute tenue et lettrage Sp5der / 555555 en sérigraphie gonflante 3D Puff Print.",
    packaging: "Sachet zippé Sp5der Worldwide avec étiquettes d'origine 1:1.",
    fitAdvice: "Coupe oversize moderne à la Young Thug. Taille normale pour un look streetwear affirmé.",
    care: "Lavage impératif sur l'envers à 30°C pour protéger les strass et la sérigraphie relief."
  },
  "essentials": {
    materials: "Molleton épuré coton/polyester ultra dense conçu par Jerry Lorenzo, au tombé lourd spectaculaire.",
    finishes: "Patch rectangulaire en silicone caoutchouté thermocollé sur la capuche et lettrage en feutrine floqué sur la poitrine ou le dos.",
    packaging: "Sachet zippé opaque épais Essentials Fear of God avec étiquette cartonnée noire et ficelle cirée.",
    fitAdvice: "Coupe oversize volumineuse très prononcée. Prenez une taille en dessous si vous préférez une coupe plus standard.",
    care: "Lavage en machine à froid, séchage à l'air libre."
  },
  "denim tears": {
    materials: "Coton lourd 450 GSM de qualité supérieure avec teinture artisanale et intérieur molletonné.",
    finishes: "Couronnes florales de coton (Cotton Wreath) sérigraphiées en relief 3D Puff Print sur l'ensemble de la pièce.",
    packaging: "Livré sous emballage protecteur Denim Tears avec étiquettes carton et étiquette tissée col.",
    fitAdvice: "Coupe droite légèrement boxy. Prenez votre taille habituelle.",
    care: "Lavage à l'envers à 30°C, repassage doux sans vapeur sur les motifs."
  },
  "palm angels": {
    materials: "Jersey de coton épais 280 GSM ou tricot technique stretch doux à haute mémoire de forme.",
    finishes: "Col montant ras-du-cou côtelé orné du logo gothique Palm Angels centré, ou bandes latérales tricotées rétro le long des manches/jambes.",
    packaging: "Emballage protecteur Palm Angels avec étiquettes cartonnées et cordon noir scellé.",
    fitAdvice: "Coupe oversize décontractée inspirée de la scène skate de Los Angeles.",
    care: "Lavage délicat à 30°C sur l'envers."
  }
};

function buildExpertDescription({ name, brand, category, colors, grade }) {
  const brandKey = (brand || '').toLowerCase().trim();
  
  // Find closest matching knowledge or generate generic luxury streetwear
  let matchedData = null;
  for (const [k, v] of Object.entries(EXPERT_KNOWLEDGE)) {
    if (brandKey.includes(k) || k.includes(brandKey)) {
      matchedData = v;
      break;
    }
  }

  if (!matchedData) {
    matchedData = {
      heritage: "Pièce incontournable du vestiaire streetwear contemporain.",
      materials: "Matière première premium rigoureusement sélectionnée (coton lourd haute densité ou tissu technique déperlant).",
      finishes: "Coutures doublées renforcées, broderies haute densité et finitions identiques au modèle original dans les moindres détails.",
      packaging: "Fournie sous emballage protecteur scellé avec toutes les étiquettes officielles conformes 1:1.",
      fitAdvice: "Coupe streetwear moderne. Prenez votre taille habituelle pour un tombé parfait.",
      care: "Lavage en machine délicat sur l'envers à 30°C pour garantir la longévité des fibres et des finitions."
    };
  }

  const articleName = name ? name.trim() : 'Pièce Streetwear';
  const brandName = brand ? brand.trim() : 'Boutique ELS';
  const quality = grade || '1:1 Miroir';
  
  // Format coloris list
  let colorsMention = "";
  if (Array.isArray(colors) && colors.length > 0) {
    colorsMention = `\n🎨 **Coloris au choix :** ${colors.join(', ')}`;
  }

  return `### **${brandName} — ${articleName}**
*(Version Certifiée Qualité ${quality})*

${matchedData.heritage || "Une pièce maîtresse alliant esthétique urbaine et finitions exceptionnelles."}

---

#### 🔍 **1. Conception & Matières d'Exception**
- **Textile & Tissage :** ${matchedData.materials}
- **Poids & Tenue :** Grammage lourd garantissant un tombé impeccable sans déformation au fil des lavages.

#### ✂️ **2. Analyse des Finitions Qualité 1:1 Miroir**
- **Détails & Précision :** ${matchedData.finishes}
- **Labels & Sécurité :** Étiquettes intérieures (wash tags, étiquettes de col, QR codes et puces) rigoureusement fidèles au millimètre.
- **Packaging Complet :** ${matchedData.packaging}

#### 📏 **3. Conseils de Coupe & Guide des Tailles**
- ${matchedData.fitAdvice}
- Disponible du **XS au 3XL** (ou pointures 38 à 46 pour les sneakers).${colorsMention}

#### 🧼 **4. Recommandations d'Entretien**
- ${matchedData.care}

---
⚠️ **Engagement Transparence ELS.SHOP :**
*Cet article est proposé en **Qualité 1:1 Miroir** (reproduction haut de gamme identique à l'original en termes de matière, de coupe, de poids et d'accessoires fournis).*`;
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

    const { name, brand, category, colors, grade } = body || {};

    if (!name && !brand) {
      return res.status(400).json({ success: false, error: 'Veuillez au moins indiquer le nom et la marque du produit.' });
    }

    const description = buildExpertDescription({ name, brand, category, colors, grade });

    return res.status(200).json({
      success: true,
      description,
      suggestedBadge: '1:1 MIROIR',
      metadata: {
        brand: brand || 'ELS',
        qualityGrade: grade || '1:1 Miroir',
        colors: colors || []
      }
    });

  } catch (error) {
    console.error('AI Generator error:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de la génération de la description.' });
  }
};
