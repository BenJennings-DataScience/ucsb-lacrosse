import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-400">UCSB Lacrosse</h1>
        <p className="text-gray-400 mt-2">Enter the password to continue</p>
      </div>

      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
