'use client';

import React from 'react';
import { useUser } from '@auth0/nextjs-auth0';

import Loading from '../../components/Loading';
import Highlight from '../../components/Highlight';

export default function Profile() {
  const { user, isLoading } = useUser();

  return (
    <>
      {isLoading && <Loading />}
      {user && (
        <>
          <div className="flex flex-row align-items-center profile-header mb-5 text-center text-md-left" data-testid="profile">
            <div className="flex flex-col">
              <img
                src={user.picture}
                alt="Profile"
                className="rounded-circle img-fluid profile-picture mb-3 mb-md-0"
                // decode="async"
                data-testid="profile-picture"
              />
            </div>
            <div className="flex flex-col">
              <h2 data-testid="profile-name">{user.name}</h2>
              <p className="lead text-muted" data-testid="profile-email">
                {user.email}
              </p>
            </div>
          </div>
          <div data-testid="profile-json">
            <Highlight>{JSON.stringify(user, null, 2)}</Highlight>
          </div>
        </>
      )}
    </>
  );
}
