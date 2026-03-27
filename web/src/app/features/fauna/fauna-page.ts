import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';

interface FaunaThreat {
  title: string;
  description: string;
  icon: string;
}

interface RescueStory {
  title: string;
  description: string;
  tag: string;
  image: string;
  tone: 'primary' | 'secondary' | 'tertiary';
}

@Component({
  selector: 'app-fauna-page',
  imports: [RouterLink, SiteFooter],
  templateUrl: './fauna-page.html',
  styleUrl: './fauna-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaunaPage {
  protected readonly threats: FaunaThreat[] = [
    {
      title: 'Fragmentacao de habitat',
      description:
        'As chamas empurram especies para corredores expostos, ampliando risco de atropelamento e perda de abrigo.',
      icon: 'local_fire_department',
    },
    {
      title: 'Impacto termico e respiratorio',
      description:
        'Animais de solo e especies mais sensiveis precisam de extracao rapida e cuidado especializado.',
      icon: 'air',
    },
  ];

  protected readonly rescueStories: RescueStory[] = [
    {
      title: 'Resgate de tamandua em frente de fogo',
      description:
        'Extracao, estabilizacao e tratamento de queimaduras leves em uma operacao de corredor norte.',
      tag: 'Sucesso',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB21-Wa6UIxjtkIAAPku5WBXi2A-x4sCuT1x7UE5_KTMDHuJAtkzdqc1K99jKLh0QKiqToHrJ2PKXjZkfYSBAWBXprgPGaSx-scbCRRzyhx3_3cz5fJVldfNsuwEqaPsL71L-02auAKhk54CfcPDZ41I0QT4wL-SbgQ4IZtiCFCHH1O0j0vVFwnUlTCTEHzey8m6Vd8320cYl9lcqR8Rgtb7WDxKij8odrZA7C1J3Z6xRXmQMd8jWkWx5TxjgmG5nKOttgtSJj_5uB4',
      tone: 'tertiary',
    },
    {
      title: 'Monitoramento intensivo de onca em recuperacao',
      description:
        'Acompanhamento de uma jovem femea apos perda de habitat e quadro inicial de desnutricao.',
      tag: 'Monitoramento',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCW0owHOQPqeJj5d5oiT491AK3dj68TY8FJbHtPQMj2lTTAIgwtPzFB5LheX2e9suopMNW7FwwO21fG0qequ4DwsJLqSqlcnhdPR26R1focpUx20raQnNHzTR1vJ2r-ZOabLMjZ-ILg3DZFH5g-teVZOqRzWpe2EeVAOCIDmy802JS3nW-nKcKdN9IIWEW1NXQF1q8LuNNNr0fHs0dGnk6Y6558KoKw2GSPOZrdlb0-1vwaZd11JHV1z_i6Jwik0STNXaG3nY8Fpelu',
      tone: 'primary',
    },
  ];
}
