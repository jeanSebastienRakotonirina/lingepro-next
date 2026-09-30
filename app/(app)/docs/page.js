export default function DocsPage() {
  return (
    <div className="text-sm text-slate-700 space-y-4">
      <h1 className="text-xl font-bold">Documentation technique</h1>
      <div className="card space-y-3">
        <p>
          <strong>Stack :</strong> Next.js 14 (App Router), Tailwind, MongoDB/Mongoose, JWT cookie httpOnly.
        </p>
        <p>
          <strong>Env :</strong> <code>MONGODB_URI</code>, <code>JWT_SECRET</code>
        </p>
        <p>
          <strong>Démarrage :</strong>
        </p>
        <pre className="bg-slate-100 p-3 rounded-xl text-xs overflow-x-auto">{`docker run -d -p 27017:27017 --name mongo mongo:7
npm install && npm run seed && npm run dev`}</pre>
        <p>
          <strong>Automatisation commande :</strong> <code>lib/automation.js</code> crée Tasks (lavage, séchage,
          repassage, pliage) + Delivery (BL-AAMMJJ-XXXX, date J+1) + incrément HV.
        </p>
        <p>
          <strong>CRUD admin :</strong> users, orders, tasks, deliveries, garments via API REST.
        </p>
        <p>
          <strong>Rôles :</strong> admin (tout + CA), operateur (atelier sans prix/CA), livreur (livraisons), client
          (ses commandes).
        </p>
        <p>
          <strong>Adresses :</strong> User.address {'{ street, postalCode, city }'} + Order.deliveryAddress +
          Delivery.address.
        </p>
      </div>
    </div>
  );
}
