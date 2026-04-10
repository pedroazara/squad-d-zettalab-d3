import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function Contato() {
  return (
    <div className="min-h-screen bg-guarawatch-surface">
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="font-display text-4xl font-bold text-guarawatch-primary mb-6">Contato</h1>
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-4 text-guarawatch-text">
          <p className="leading-relaxed">
            Este canal e destinado a duvidas sobre uso da plataforma, sugestoes de melhoria e parcerias tecnicas.
          </p>
          <div className="grid gap-3 text-sm">
            <div><span className="font-semibold">Email:</span> contato@guarawatch.org</div>
            <div><span className="font-semibold">Atendimento:</span> segunda a sexta, 9h as 18h</div>
            <div><span className="font-semibold">Equipe:</span> Squad D - ZettaLab D3</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
