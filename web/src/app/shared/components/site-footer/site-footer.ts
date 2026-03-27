import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  protected readonly currentYear = new Date().getFullYear();
  protected readonly footerLinks = [
    { label: 'Inicio', path: '/' },
    { label: 'Painel', path: '/painel' },
    { label: 'Notificar', path: '/notificar' },
    { label: 'Prevencao', path: '/prevencao' },
    { label: 'Sobre', path: '/sobre' },
  ];
}
