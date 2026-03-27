import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';

interface JoinPath {
  title: string;
  description: string;
  icon: string;
  buttonLabel: string;
  queryParams: { role: 'coordenacao' | 'brigadista' };
  tone: 'primary' | 'secondary' | 'tertiary';
}

@Component({
  selector: 'app-join-page',
  imports: [RouterLink, SiteFooter],
  templateUrl: './join-page.html',
  styleUrl: './join-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinPage {
  protected readonly paths: JoinPath[] = [
    {
      title: 'Sou produtor rural',
      description:
        'Integre sua propriedade ao monitoramento e receba orientacao inicial para prevencao e alerta.',
      icon: 'agriculture',
      buttonLabel: 'Engajar propriedade',
      queryParams: { role: 'coordenacao' },
      tone: 'primary',
    },
    {
      title: 'Quero ser voluntario',
      description:
        'Entre na rede de brigadas, apoio logistico e resgate com um fluxo simples de adesao inicial.',
      icon: 'volunteer_activism',
      buttonLabel: 'Alistar agora',
      queryParams: { role: 'brigadista' },
      tone: 'secondary',
    },
    {
      title: 'Quero apoiar',
      description:
        'Registre seu interesse institucional e ajude a fortalecer campanhas, tecnologia e operacao.',
      icon: 'favorite',
      buttonLabel: 'Abrir contato',
      queryParams: { role: 'coordenacao' },
      tone: 'tertiary',
    },
  ];
}
