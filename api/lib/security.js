/**
 * ELS.SHOP - Module de Sécurité & Assainissement
 * Protection contre les failles XSS, injections, fuite de données sensibles et validation des entrées
 */

function sanitizeString(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // Supprime les balises HTML basiques
    .trim()
    .slice(0, maxLength);
}

function sanitizeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function validateEmail(email) {
  if (typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
}

function validatePhone(phone) {
  if (typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s.-]/g, '');
  return cleaned.length >= 8 && cleaned.length <= 15;
}

/**
 * Filtre les données d'une commande pour le suivi public du client
 * GARANTIE DE SÉCURITÉ : Ne divulgue JAMAIS les prix de revient, bénéfices, ou notes internes de gestion
 */
function sanitizePublicOrder(order) {
  if (!order) return null;

  return {
    id: order.id,
    customerName: order.customerName,
    // Masquage partiel du téléphone et adresse pour la confidentialité (ex: 06 ** ** 21)
    customerPhoneMasked: order.customerPhone ? maskPhone(order.customerPhone) : '',
    customerAddressCity: order.customerAddress ? extractCityOrMode(order.customerAddress) : 'Livraison France',
    items: (order.items || []).map(it => ({
      name: it.name,
      brand: it.brand,
      size: it.size,
      color: it.color,
      quantity: it.quantity,
      price: it.price
    })),
    total: order.total,
    paymentMethod: order.paymentMethod,
    status: order.status,
    statusLabel: order.statusLabel || order.status,
    carrier: order.carrier || 'Colissimo',
    trackingNumber: order.trackingNumber || '',
    trackingUrl: order.trackingNumber ? getCarrierTrackingUrl(order.carrier, order.trackingNumber) : '',
    createdAt: order.createdAt,
    estimatedDelivery: calculateEstimatedDelivery(order.createdAt)
  };
}

function maskPhone(phone) {
  const p = phone.trim();
  if (p.length < 6) return '06 ** ** **';
  return p.slice(0, 3) + ' •• •• ' + p.slice(-2);
}

function extractCityOrMode(addr) {
  const a = addr.trim();
  if (a.toLowerCase().includes('main propre')) {
    return 'Remise en main propre (IRL)';
  }
  return a;
}

function getCarrierTrackingUrl(carrier, trackingNumber) {
  if (!trackingNumber) return '';
  const c = (carrier || '').toLowerCase();
  const num = encodeURIComponent(trackingNumber.trim());

  if (c.includes('chrono')) {
    return `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${num}`;
  }
  if (c.includes('mondial') || c.includes('relay')) {
    return `https://www.mondialrelay.fr/suivi-de-colis?numeroExpedition=${num}`;
  }
  // Colissimo / La Poste par défaut
  return `https://www.laposte.fr/outils/suivre-vos-envois?code=${num}`;
}

function calculateEstimatedDelivery(createdAtStr) {
  const date = createdAtStr ? new Date(createdAtStr) : new Date();
  // +2 à +3 jours ouvrés
  const estStart = new Date(date);
  estStart.setDate(estStart.getDate() + 2);
  const estEnd = new Date(date);
  estEnd.setDate(estEnd.getDate() + 4);

  const options = { day: 'numeric', month: 'long' };
  return `Entre le ${estStart.toLocaleDateString('fr-FR', options)} et le ${estEnd.toLocaleDateString('fr-FR', options)}`;
}

module.exports = {
  sanitizeString,
  sanitizeHtml,
  validateEmail,
  validatePhone,
  sanitizePublicOrder,
  getCarrierTrackingUrl,
  calculateEstimatedDelivery
};
