import React from 'react';
import { auth0 } from '../../../lib/auth0';
import { redirect } from 'next/navigation';

export default async function Index() {
  const session = await auth0.getSession();
  if (session) {
    redirect('/');
  }
  return (
    <div className="flex flex-col p-2 gap-4">
      <div className="text-4xl m-3 text-center">Playlist Manager</div>
      <div className="text-3xl m-3 text-center">Login to continue</div>
      <a href="auth/login" className="flex flex-col gap-8">
        Login
      </a>
    </div>
  );
}
