import './globals.css';

export const metadata = {
  title: "Text'eau — Le nettoyage nature",
  description: 'Gestion de blanchisserie professionnelle',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
