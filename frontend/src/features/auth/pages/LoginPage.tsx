import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../../core/contexts';
import { authService } from '../../../core/api';
import { validationSchemas, validate, formatValidationErrors } from '../../../core/utils/validation';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar email
    const emailResult = validate(validationSchemas.email, email);
    if (!emailResult.success) {
      setError(formatValidationErrors(emailResult.errors!));
      return;
    }

    // Validar password
    const passwordResult = validate(validationSchemas.password, password);
    if (!passwordResult.success) {
      setError(formatValidationErrors(passwordResult.errors!));
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      login(response.accessToken, response.refreshToken);
      navigate('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Credenciales inválidas';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [email, password, navigate, login]);

  const handleGoogleSuccess = useCallback(async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError('No se recibió credencial de Google');
      return;
    }

    setGoogleLoading(true);
    setError('');

    try {
      // Enviar el credential token al backend para verificación server-side
      const response = await authService.googleAuth({
        credential: credentialResponse.credential,
      });
      login(response.accessToken, response.refreshToken, response.user.provider || 'google');
      navigate('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al iniciar sesión con Google';
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  }, [navigate, login]);

  const handleGoogleError = useCallback(() => {
    setError('Error al iniciar sesión con Google. Por favor intenta de nuevo.');
  }, []);

  const GoogleLoginButton = () => (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap={false}
        auto_select={false}
        cancel_on_tap_outside={false}
        context="signin"
        ux_mode="popup"
        shape="rectangular"
        text="signin_with"
        logo_alignment="left"
        width="280"
      />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-secondary-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-secondary-400">
            Accede a tu cuenta de Finanzas Personales
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-secondary-300">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:text-white"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-secondary-300">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-secondary-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-secondary-900 text-gray-500 dark:text-secondary-400">
                o
              </span>
            </div>
          </div>

          <div className="google-login-container w-full flex justify-center">
            {googleLoading ? (
              <div className="flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 dark:border-secondary-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-secondary-800">
                <svg className="animate-spin h-5 w-5 text-gray-700 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión con Google...
              </div>
            ) : (
              <GoogleLoginButton />
            )}
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-secondary-400">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
