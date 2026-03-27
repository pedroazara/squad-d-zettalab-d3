import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';

interface EmergencyStep {
  title: string;
  description: string;
}

interface EmergencyInfo {
  title: string;
  description: string;
}

@Component({
  selector: 'app-emergency-page',
  imports: [ReactiveFormsModule, SiteFooter],
  templateUrl: './emergency-page.html',
  styleUrl: './emergency-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmergencyPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly successMessage = signal('');

  protected readonly steps: EmergencyStep[] = [
    {
      title: 'Afaste-se do perigo',
      description:
        'Nao tente combater o fogo sem equipamento. Procure area segura, sem vegetacao e contra o vento.',
    },
    {
      title: 'Reuna informacoes',
      description:
        'Observe pontos de referencia, direcao da fumaca e se ha fauna ou moradias em risco imediato.',
    },
    {
      title: 'Aguarde orientacoes',
      description:
        'Mantenha o telefone disponivel. Em um fluxo real, a central retornaria com a brigada acionada.',
    },
  ];

  protected readonly infoCards: EmergencyInfo[] = [
    {
      title: 'Central de apoio',
      description:
        'Em caso de falha de formulario, a linha tatico-operacional pode assumir o registro.',
    },
    {
      title: 'Tempo de resposta',
      description:
        'Brigadas posicionadas em hubs estrategicos. Media operacional simulada de deslocamento: 12 a 24 minutos.',
    },
    {
      title: 'Compromisso etico',
      description:
        'Dados e localizacao devem ser usados apenas para suporte a missao e acionamento seguro da operacao.',
    },
  ];

  protected readonly form = this.formBuilder.group({
    location: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    phone: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected useDemoLocation(): void {
    this.form.controls.location.setValue(
      'Setor norte do Cerrado - referencia visual proxima a area de mata',
    );
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.successMessage.set('');
      return;
    }

    this.successMessage.set(
      'Alerta demo registrado com sucesso. Em uma integracao real, a central e as brigadas receberiam o acionamento.',
    );
  }

  protected hasError(
    controlName: 'location' | 'description' | 'phone',
    errorCode: string,
  ): boolean {
    const control = this.form.controls[controlName];
    return control.touched && control.hasError(errorCode);
  }
}
