const KB = [
  { q: ['commander', 'commande', 'nouvelle'], a: 'Allez dans « Nouvelle commande », choisissez les articles, quantités (+/− ou saisie manuelle), adresse de livraison, puis validez. Les tâches atelier et le bon de livraison sont créés automatiquement.' },
  { q: ['tache', 'tâches', 'atelier', 'lavage'], a: 'Dès qu’une commande est reçue, les tâches lavage, séchage, repassage et pliage s’affichent dans « Tâches ». Marquez-les terminées au fur et à mesure.' },
  { q: ['livraison', 'bl', 'bon de'], a: 'Un bon de livraison (BL-AAMMJJ-XXXX) est généré automatiquement à la commande, date prévue J+1. Consultez « Livraisons » pour le suivi et l’impression PDF.' },
  { q: ['prix', 'tarif'], a: 'Les prix sont visibles uniquement pour le client et l’admin (commandes et factures). Opérateur et livreur ne voient pas les montants.' },
  { q: ['machine', 'lave', 'séchoir', 'girbau'], a: 'Parc : lavage 80+3×60+45 kg, séchage 80+2×60+42 kg, repassage Girbau/Danube/calandre, pliage Foltext. Page « Machines » pour planifier.' },
  { q: ['réfléchissant', 'hv', 'gilet'], a: 'Les vêtements HV ont un nombre max de lavages (ex. 50). Page « Réfléchissants » : suivi, alertes, hors service automatique.' },
  { q: ['annul'], a: 'Une commande peut être annulée tant qu’elle n’est pas livrée (client si pending/processing, staff toujours).' },
  { q: ['adresse', 'code postal', 'ville'], a: 'Chaque utilisateur (admin/client) a une adresse : rue, code postal, ville. Elle est reprise sur les BL et les commandes.' },
  { q: ['role', 'rôle', 'admin', 'client'], a: 'Admin : tout + CA + users. Opérateur : commandes/tâches/machines sans prix ni CA. Livreur : livraisons. Client : ses commandes et messages.' },
  { q: ['pdf', 'imprimer'], a: 'Sur une commande ou livraison, boutons PDF / Imprimer pour le bon de travail et le bon de livraison.' },
  { q: ['aide', 'tutoriel', 'navigation'], a: 'Utilisez le bouton ? pour le tutoriel, le chat violet pour l’assistant, et les pages Aide / Docs techniques dans le menu.' },
];

export function askAI(message, page = '') {
  const text = (message || '').toLowerCase();
  let best = null;
  let score = 0;
  for (const row of KB) {
    let s = 0;
    for (const k of row.q) if (text.includes(k)) s += 1;
    if (s > score) {
      score = s;
      best = row.a;
    }
  }
  if (best) return best;
  if (page.includes('new-order')) return 'Ajoutez des quantités avec +/− ou en saisissant le nombre, puis validez. L’atelier et le BL se créent seuls.';
  if (page.includes('tasks')) return 'Cochez les tâches terminées. Elles viennent automatiquement de chaque nouvelle commande.';
  return 'Je peux aider sur les commandes, tâches, livraisons, machines, vêtements HV, rôles et adresses. Posez une question précise ou ouvrez Aide.';
}

export function pageSuggestions(pathname = '') {
  if (pathname.includes('new-order')) return ['Comment ajouter une quantité ?', 'Adresse de livraison ?'];
  if (pathname.includes('tasks')) return ['Comment fonctionnent les tâches auto ?'];
  if (pathname.includes('garment')) return ['Limite de lavages HV ?'];
  if (pathname.includes('machine')) return ['Capacités des machines ?'];
  return ['Comment commander ?', 'Où sont les bons de livraison ?', 'Qui voit les prix ?'];
}

export const TUTORIAL_STEPS = [
  { title: 'Bienvenue chez Text\'eau', body: 'Application de gestion de blanchisserie : commandes, atelier, livraisons et suivi HV.' },
  { title: 'Menu', body: 'Utilisez le menu latéral (ou bas sur mobile). Selon votre rôle, certaines sections sont masquées.' },
  { title: 'Commander', body: 'Nouvelle commande → articles → quantités → adresse. Tâches + BL créés automatiquement.' },
  { title: 'Atelier', body: 'Tâches lavage / séchage / repassage / pliage. Machines pour planifier les charges.' },
  { title: 'Assistant', body: 'Bouton violet en bas à droite : aide instantanée gratuite.' },
  { title: 'C’est parti', body: 'Le tutoriel est relançable via le bouton ?' },
];
