/**
 * ELS.SHOP - API de Rachat Cash / Dépôt Vêtements
 * Permet aux utilisateurs de proposer des pièces streetwear à la vente à Eliott & Ilies
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const { nom, contact, marque, article, taille, condition, prix, photos, notes } = body || {};

    if (!nom || !contact || !marque || !article) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez renseigner votre nom, moyen de contact (Email / Instagram / Tel), marque et article.'
      });
    }

    const ticketId = 'ELS-BUY-' + Math.floor(1000 + Math.random() * 9000);
    const dateSubmitted = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

    console.log(`[RACHAT ELS.SHOP] Nouveau dossier ${ticketId} soumis par ${nom} (${contact}) : ${marque} - ${article} (${taille || 'Taille non spécifiée'}) à ${prix || 0}€`);

    return res.status(200).json({
      success: true,
      ticketId,
      message: `Votre demande a bien été transmise à Eliott & Ilies ! Nous vous répondrons sous 24h avec une offre de rachat ferme.`,
      summary: {
        ticketId,
        nom,
        contact,
        marque,
        article,
        taille,
        condition,
        prix: prix ? `${prix} €` : 'À estimer',
        date: dateSubmitted
      }
    });

  } catch (error) {
    console.error('Rachat error:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de la soumission de la demande.' });
  }
};
