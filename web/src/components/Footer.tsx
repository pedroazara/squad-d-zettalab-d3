import { Link } from 'wouter';
import LogoBrand from './LogoBrand';

export default function Footer() {
  return (
    <footer className="bg-guarawatch-primary text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Logo & Tagline */}
          <div>
            <div className="flex items-center gap-0 mb-2">
              <LogoBrand size="sm" />
              <span className="font-display text-lg font-bold">GuaráWatch</span>
            </div>
            <p className="text-sm text-gray-300">Antecipar riscos. Proteger o bioma.</p>
          </div>

          {/* Center Column - Quick Links */}
          <div>
            <h3 className="font-heading text-sm font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/sobre">
                  <a className="text-gray-300 hover:text-guarawatch-accent transition-colors">
                    Sobre
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/metodologia">
                  <a className="text-gray-300 hover:text-guarawatch-accent transition-colors">
                    Metodologia
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/api">
                  <a className="text-gray-300 hover:text-guarawatch-accent transition-colors">
                    API
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/contato">
                  <a className="text-gray-300 hover:text-guarawatch-accent transition-colors">
                    Contato
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Right Column - Data Sources */}
          <div>
            <h3 className="font-heading text-sm font-semibold mb-4">Fontes de Dados</h3>
            <div className="flex gap-4">
              <a href="#" className="text-gray-300 hover:text-guarawatch-accent transition-colors text-xs">
                MapBiomas
              </a>
              <a href="#" className="text-gray-300 hover:text-guarawatch-accent transition-colors text-xs">
                INMET
              </a>
              <a href="#" className="text-gray-300 hover:text-guarawatch-accent transition-colors text-xs">
                INPE
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-guarawatch-secondary pt-8 text-center text-xs text-gray-400">
          <p>Desenvolvido por Squad D · ZettaLab D3 · 2025</p>
        </div>
      </div>
    </footer>
  );
}
