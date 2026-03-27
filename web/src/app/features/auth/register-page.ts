import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';
import { AuthService } from '../../core/auth/auth.service';

const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, SiteFooter],
  templateUrl: './register-page.html',
  styleUrl: './auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly errorMessage = signal('');

  protected readonly form = this.formBuilder.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      organization: ['', [Validators.required, Validators.minLength(3)]],
      role: ['coordenacao' as 'coordenacao' | 'brigadista', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [passwordsMatchValidator],
    },
  );

  constructor() {
    const requestedRole = this.route.snapshot.queryParamMap.get('role');

    if (requestedRole === 'coordenacao' || requestedRole === 'brigadista') {
      this.form.controls.role.setValue(requestedRole);
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');

    const { confirmPassword: _confirmPassword, ...payload } = this.form.getRawValue();
    const result = this.authService.register(payload);

    if (!result.success) {
      this.errorMessage.set(result.message);
      return;
    }

    const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/painel';
    void this.router.navigateByUrl(redirect);
  }

  protected hasError(
    controlName: 'name' | 'organization' | 'role' | 'email' | 'password' | 'confirmPassword',
    errorCode: string,
  ): boolean {
    const control = this.form.controls[controlName];
    return control.touched && control.hasError(errorCode);
  }

  protected hasPasswordMismatch(): boolean {
    return this.form.touched && this.form.hasError('passwordMismatch');
  }
}
