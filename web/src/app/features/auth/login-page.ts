import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';
import { AuthService } from '../../core/auth/auth.service';
import { DEMO_USERS } from '../../core/auth/auth.models';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, SiteFooter],
  templateUrl: './login-page.html',
  styleUrl: './auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly errorMessage = signal('');
  protected readonly demoCredentials = DEMO_USERS.map((credential) => ({
    label: credential.role === 'coordenacao' ? 'Coordenacao' : 'Brigadista',
    email: credential.email,
    password: credential.password,
  }));

  protected readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    const result = this.authService.login(this.form.getRawValue());

    if (!result.success) {
      this.errorMessage.set(result.message);
      return;
    }

    const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/painel';
    void this.router.navigateByUrl(redirect);
  }

  protected hasError(controlName: 'email' | 'password', errorCode: string): boolean {
    const control = this.form.controls[controlName];
    return control.touched && control.hasError(errorCode);
  }

  protected fillDemoCredential(email: string, password: string): void {
    this.errorMessage.set('');
    this.form.setValue({ email, password });
  }
}
