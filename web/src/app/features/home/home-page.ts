import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';

interface MissionAction {
  title: string;
  description: string;
  icon: string;
  route: string;
  tone: 'primary' | 'secondary' | 'tertiary';
}

interface ImpactMetric {
  value: string;
  label: string;
  tone: 'primary' | 'secondary' | 'tertiary';
}

interface ActionReport {
  location: string;
  title: string;
  description: string;
  image: string;
  route: string;
}

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, SiteFooter],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly missionActions: MissionAction[] = [
    {
      title: 'Prevenir queimadas',
      description:
        'Protocolos de manejo, vigilancia e checklist de prontidao para propriedades e equipes.',
      icon: 'shield',
      route: '/prevencao',
      tone: 'tertiary',
    },
    {
      title: 'Reportar incendio',
      description: 'Canal de emergencia para acionar brigadas e central de resposta em minutos.',
      icon: 'warning',
      route: '/emergencia',
      tone: 'secondary',
    },
    {
      title: 'Aprender com a fauna',
      description:
        'Visao sobre resgate, reabilitacao e impacto do fogo na biodiversidade do Cerrado.',
      icon: 'pets',
      route: '/fauna',
      tone: 'primary',
    },
    {
      title: 'Participar da alianca',
      description: 'Engaje propriedade, voluntariado ou apoio institucional na rede de protecao.',
      icon: 'handshake',
      route: '/participar',
      tone: 'primary',
    },
  ];

  protected readonly impactMetrics: ImpactMetric[] = [
    {
      value: '120.000 ha',
      label: 'areas acompanhadas com foco em prevencao e resposta tatico-operacional',
      tone: 'tertiary',
    },
    {
      value: '450',
      label: 'animais resgatados em operacoes integradas de combate e cuidado',
      tone: 'secondary',
    },
    {
      value: '1.200',
      label: 'membros e aliados conectados a uma rede de vigilancia colaborativa',
      tone: 'primary',
    },
  ];

  protected readonly reports: ActionReport[] = [
    {
      location: 'Goias | Operativo',
      title: 'Nova brigada formada no setor norte ja integrada aos protocolos da alianca',
      description:
        'Treinamento intensivo de 48 horas finalizado com foco em resposta rapida, comunicacao e seguranca de campo.',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuApm3nOe9E6n_h00tX3zcPnQw8vzqpj3Yje8DQCAgx3kw5p7qDKLW11l_etndG8EVGpLNe8sIAIM1mCjWX3rI6lfEPXLPuDV8-SAfqwRBCk2RUKYBX1otLAQLGC-TUjMw_K_qup29nqJ9xEqlBV9R9z_ELiEC7Hi3raTYwaJ_HFdrMigNOhAjaKamwBK4o9oq1bE5TIWCjS_NiyC31I8e2vwlsJ530DXoJFQndI1MVrN-i4Pq19AkbH7PewponWsHEdDUcbEBMxd0BP',
      route: '/prevencao',
    },
    {
      location: 'Mato Grosso | Fauna',
      title: 'Onca ferida em area de incendio recebeu atendimento em unidade de resgate',
      description:
        'A operacao combinou extracao, estabilizacao clinica e monitoramento inicial para reabilitacao segura.',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDwm0UCDXWJz6UHCJ96YSv2gP1bZhQgn4oCCfDvGGlDtjo6icfK-AvT3IM994VReiElAqO2WAdGaxbGsiZcx39wkk7oqb56qGswwYpkiOwwcEjIXChsSHdzg46iSLm17e-XbXixuHwuIPslUg6xCWOyQ3_eBtgxMh-D6Xio0pVvneAjyfV86XsTnmv7zuB9IfuaxqeOYVEv_frQymt8zvSZRgKWqeC7qCQdg_KCQIW6IsGkrmSjPY2ETSjt6sDJzkKNBizUF37Jvki8',
      route: '/fauna',
    },
  ];
}
