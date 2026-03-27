import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';

interface ConceptCard {
  title: string;
  description: string;
  icon: string;
  tone: 'primary' | 'secondary' | 'tertiary';
  image: string;
}

interface BridgeNode {
  title: string;
  icon: string;
  tone: 'primary' | 'secondary' | 'tertiary' | 'default';
}

interface ValueCard {
  title: string;
  description: string;
  icon: string;
  tone: 'primary' | 'secondary' | 'tertiary';
}

@Component({
  selector: 'app-about-page',
  imports: [SiteFooter],
  templateUrl: './about-page.html',
  styleUrl: './about-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  protected readonly concepts: ConceptCard[] = [
    {
      title: 'Cerrado',
      description:
        'O coracao hidrico e biologico do Brasil, cuja protecao exige inteligencia territorial e leitura fina do bioma.',
      icon: 'eco',
      tone: 'tertiary',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDJvbDVZrpszEe4ep6MYRt11CEaDs2gIdfD3h4Vpa2Ws7keL7tkCniVa79WX8wTtjUze_V7-oMzXPZF6bATkguXJDK3oyG4q_-8uz4DgiOOH9nUAerE0lY6-K6-VWJKpkoLs4ImkKPUasTVUyovlzgvK8tTdyFsVxjrx4dbxCxzdrTgNe5NN1co9U722WOt-XBF-EW3v1MSYqqQZzv-hQdYPIBEZfKWng9QVz0UQ187-W0zeHKBUmY0seCb0PvWuintHuwdwGAXSBwn',
    },
    {
      title: 'Forca',
      description:
        'Resposta rapida, leitura de risco e coordenacao de operacoes que precisam agir antes do incendio escalar.',
      icon: 'local_fire_department',
      tone: 'secondary',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBTc76VmBW5rFCl-hE3PHqxl3i25BCvgSRDha5mFAdExCt-rt_JSPJO-p4S8Iujy-sOCcPdtsyUt2cJcitx0KuhE4EOjhHYrBzYmsmuH4PMYJV6dWF-DMQAmuYqFfXN0RoHBVt0FUl82bZR1S2WFizA6-Fwqra8jzM7Wh7lYo38H-zHYGOdiOW9IUJPR6KzYEv2uEbPK5INtNBmUmJhbeERbXYt3fTfuzWSVvKrJ5as-6GBxX8-cuaVPG0E3dyPmUKJCsrHBqRTFpcK',
    },
    {
      title: 'Alianca',
      description:
        'Brigadistas, resgate de fauna, analise e comunicacao atuando como uma rede unica e complementar.',
      icon: 'security',
      tone: 'primary',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA_piA5bKoIsLr_VA7-XRjPM7yPufWVW1_jASGbUZluq2K7GlW8LE2Q7ZWYZAyLcT_COSlINs44s74VpfpzxvZjZrCWZ4l_4o_5tRp1aVYaO813d6idOla2XhmeLY6nD1i8AQSGqFwSUCUDRZggaJ5JDudw8NK-EofQ-EJUkG_2Jj_lRuuVu3GwJJ_xveyl7qYhHzj8cueosnAH6a1z8HRWIaOQC4Y_XanO6cif-YAmy5KywDbQzo_g2WTnOb5NVF4Xqm9_esYipdAe',
    },
  ];

  protected readonly bridgeNodes: BridgeNode[] = [
    { title: 'Logistica hidrica', icon: 'water_drop', tone: 'secondary' },
    { title: 'Resgate emergencial', icon: 'pets', tone: 'primary' },
    { title: 'Reabilitacao pos-fogo', icon: 'shield_with_heart', tone: 'tertiary' },
    { title: 'Analise de risco', icon: 'analytics', tone: 'default' },
  ];

  protected readonly values: ValueCard[] = [
    {
      title: 'Precisao tecnologica',
      description:
        'Sensores, geoprocessamento e leitura rapida do territorio para decidir antes do dano.',
      icon: 'radar',
      tone: 'secondary',
    },
    {
      title: 'Unidade interdisciplinar',
      description:
        'Combate, fauna, dados e comunicacao operando em sincronia dentro da mesma missao.',
      icon: 'diversity_3',
      tone: 'primary',
    },
    {
      title: 'Integridade absoluta',
      description: 'Criterio tecnico, clareza operacional e protecao de dados em cada etapa.',
      icon: 'local_police',
      tone: 'tertiary',
    },
    {
      title: 'Prontidao 24/7',
      description: 'Atuacao preparada para prevenir, orientar e responder com velocidade.',
      icon: 'bolt',
      tone: 'secondary',
    },
  ];
}
