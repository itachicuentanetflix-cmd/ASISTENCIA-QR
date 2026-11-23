import './globals.css';
import SW from '@/components/SW';

export const metadata = {
  title: 'Asistencia QR',
  description: 'Control de asistencia escolar con QR y reconocimiento facial',
  manifest: '/manifest.json',
  icons: { icon: '/icon-192.png', apple: '/apple-icon.png' },
  appleWebApp: { capable: true, title: 'Asistencia', statusBarStyle: 'black-translucent' },
};
export const viewport = { themeColor: '#070b18', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }) {
  return (<html lang="es"><body>{children}<SW /></body></html>);
}
