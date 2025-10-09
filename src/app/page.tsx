import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <LoginForm />
    </div>
  );
}
