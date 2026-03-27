import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';

interface DashboardCard {
  title: string;
  description: string;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, SiteFooter],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly authService = inject(AuthService);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly roleLabel = computed(() =>
    this.currentUser()?.role === 'coordenacao'
      ? 'Coordenacao tatico-operacional'
      : 'Brigadista em campo',
  );

  protected readonly actionCards: DashboardCard[] = [
    {
      title: 'Consolidar integracao com API',
      description: 'Substituir o mock local por endpoints reais de autenticacao e perfis.',
    },
    {
      title: 'Desenhar mapa operacional',
      description: 'Acoplar dados geoespaciais e areas de risco ao painel de comando.',
    },
    {
      title: 'Fechar sprint visual',
      description: 'Refinar componentes reutilizaveis e ampliar a biblioteca do design system.',
    },
  ];

  protected readonly readinessCards: DashboardCard[] = [
    {
      title: 'Status da base',
      description: 'Frontend organizado por features, com design tokens e rotas preparadas.',
    },
    {
      title: 'Autenticacao demo',
      description: 'Cadastro e login locais funcionando para demonstracao sem depender de backend.',
    },
    {
      title: 'Documentacao',
      description: 'Documento de arquitetura tecnologica pronto para orientar o time.',
    },
  ];
}
