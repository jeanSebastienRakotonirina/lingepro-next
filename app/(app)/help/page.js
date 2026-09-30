export default function HelpPage() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1 className="text-xl font-bold mb-4">Aide utilisateur</h1>
      <div className="card space-y-4 text-sm text-slate-700">
        <section>
          <h2 className="font-semibold">Commander</h2>
          <p>
            Menu <strong>Nouvelle commande</strong> → quantités (+ / − ou saisie manuelle) → adresse (rue, CP, ville) →
            Valider. Les <strong>tâches atelier</strong> et le <strong>bon de livraison</strong> (J+1) sont créés
            automatiquement.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Tâches & machines</h2>
          <p>Lavage, séchage, repassage, pliage. Parc : lave-linge 80/60/45 kg, séchoirs 80/60/42 kg, Girbau, Danube, Foltext.</p>
        </section>
        <section>
          <h2 className="font-semibold">Prix</h2>
          <p>Visibles uniquement pour <strong>client</strong> et <strong>admin</strong>. Opérateur et livreur ne voient pas les montants.</p>
        </section>
        <section>
          <h2 className="font-semibold">Vêtements HV</h2>
          <p>Limite de lavages (souvent 50). Alertes puis hors service automatique.</p>
        </section>
        <section>
          <h2 className="font-semibold">Adresses</h2>
          <p>Rue, code postal et ville sont gérés sur le profil utilisateur et repris sur commandes / BL.</p>
        </section>
      </div>
    </div>
  );
}
