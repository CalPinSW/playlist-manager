'use client';

import { toast } from 'react-toastify';
import LoadingSpinner from './LoadingSpinner';
import { FC, ReactNode, useState } from 'react';

interface AsyncButtonProps {
  children: ReactNode;
  onClick(): Promise<void>;
  successMessage?: string;
  className?: string;
}

const AsyncButton: FC<AsyncButtonProps> = ({ children, onClick, successMessage, className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    setIsError(false);
    await onClick()
      .then(() => {
        if (successMessage) {
          toast(successMessage, {
            type: 'success',
            closeOnClick: true,
            position: 'bottom-right',
            theme: 'dark'
          });
        }
      })
      .catch((e: Error) => {
        setIsError(true);
        toast(e.message, {
          type: 'error',
          position: 'bottom-right',
          theme: 'dark',
          closeOnClick: true,
          onClose: () => {
            setIsError(false);
          }
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <button
      className={`p-2 rounded hover:bg-background-interactive cursor-pointer active:bg-primary ${
        isLoading ? 'bg-primary-darker' : ''
      } ${isError ? 'bg-warning' : ''} ${className}`}
      onClick={handleClick}>
      <div className={`p-2 ${isLoading ? 'hidden' : ''}`}>{children}</div>
      <div className={`m-auto h-8 w-8 ${isLoading ? '' : 'hidden'}`}>
        <LoadingSpinner />
      </div>
    </button>
  );
};

export default AsyncButton;
