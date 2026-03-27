import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly navItems = [
    { label: 'Inicio', path: '/' },
    { label: 'Painel', path: '/painel' },
    { label: 'Notificar', path: '/notificar' },
    { label: 'Prevencao', path: '/prevencao' },
    { label: 'Sobre', path: '/sobre' },
  ];

  protected readonly currentUser = this.authService.currentUser;
  protected readonly userRoleLabel = computed(() => {
    const user = this.currentUser();

    if (!user) {
      return '';
    }

    return user.role === 'coordenacao' ? 'Coordenacao' : 'Brigadista';
  });

  protected logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/');
  }
}
