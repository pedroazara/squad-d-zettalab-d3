import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';

interface PreventionPillar {
  title: string;
  description: string;
  icon: string;
  tone: 'primary' | 'secondary' | 'tertiary';
}

interface ChecklistItem {
  label: string;
  checked: boolean;
}

@Component({
  selector: 'app-prevention-page',
  imports: [SiteFooter],
  templateUrl: './prevention-page.html',
  styleUrl: './prevention-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreventionPage {
  protected readonly pillars: PreventionPillar[] = [
    {
      title: 'Aceiros limpos',
      description:
        'Faixas bem mantidas ajudam a impedir o avanco de chamas rasteiras em divisas e areas sensiveis.',
      icon: 'landscape',
      tone: 'tertiary',
    },
    {
      title: 'Queima controlada',
      description:
        'Uso do fogo apenas com autorizacao, janela climatica adequada e criterio tecnico bem definido.',
      icon: 'local_fire_department',
      tone: 'secondary',
    },
    {
      title: 'Cuidado com maquinas',
      description:
        'Escapamentos, eletrica e manutencao preventiva reduzem uma das fontes mais comuns de ignicao.',
      icon: 'precision_manufacturing',
      tone: 'primary',
    },
    {
      title: 'Vigilancia atenta',
      description:
        'Acompanhamento constante do periodo seco, dos horarios criticos e de sinais iniciais de fumaca.',
      icon: 'visibility',
      tone: 'tertiary',
    },
    {
      title: 'Reserva preservada',
      description:
        'Corredores ecologicos protegidos ajudam o bioma a resistir e a fauna a manter rotas seguras.',
      icon: 'forest',
      tone: 'secondary',
    },
    {
      title: 'Comunicacao rapida',
      description:
        'Alertar cedo e com boa referencia de local reduz tempo de resposta e limita a escalada do dano.',
      icon: 'emergency_share',
      tone: 'primary',
    },
  ];

  private readonly checklistState = signal<ChecklistItem[]>([
    { label: 'Equipamento de combate revisado?', checked: false },
    { label: 'Aceiros em dia e desobstruidos?', checked: false },
    { label: 'Equipe treinada para protocolos iniciais?', checked: false },
    { label: 'Reservas de agua estrategicamente cheias?', checked: false },
    { label: 'Canal de radio e celular testados?', checked: false },
  ]);

  protected readonly checklist = this.checklistState.asReadonly();
  protected readonly checkedCount = computed(
    () => this.checklistState().filter((item) => item.checked).length,
  );
  protected readonly readinessMessage = signal('');

  protected toggleChecklistItem(index: number, checked: boolean): void {
    this.checklistState.update((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, checked } : item)),
    );
    this.readinessMessage.set('');
  }

  protected validateChecklist(): void {
    const total = this.checklistState().length;
    const checkedCount = this.checkedCount();

    if (checkedCount === total) {
      this.readinessMessage.set(
        'Prontidao validada. A equipe esta alinhada com os protocolos iniciais.',
      );
      return;
    }

    this.readinessMessage.set(
      `Checklist incompleto. Faltam ${total - checkedCount} itens para fechar a prontidao.`,
    );
  }
}
