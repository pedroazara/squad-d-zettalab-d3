import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function Perfil() {
  return (
    <div className="min-h-screen bg-guarawatch-surface">
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="font-display text-4xl font-bold text-guarawatch-primary mb-6">Perfil</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="font-heading text-xl font-semibold text-guarawatch-primary">Dados da Conta</h2>
            <div className="space-y-2 text-sm text-guarawatch-text">
              <p><span className="font-semibold">Nome:</span> Usuario Demo</p>
              <p><span className="font-semibold">Email:</span> usuario@demo.com</p>
              <p><span className="font-semibold">Perfil:</span> Pesquisador</p>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="font-heading text-xl font-semibold text-guarawatch-primary">Preferencias</h2>
            <div className="space-y-2 text-sm text-guarawatch-text">
              <p><span className="font-semibold">Bioma favorito:</span> Cerrado</p>
              <p><span className="font-semibold">Estado favorito:</span> Mato Grosso</p>
              <p><span className="font-semibold">Formato padrao:</span> CSV</p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
