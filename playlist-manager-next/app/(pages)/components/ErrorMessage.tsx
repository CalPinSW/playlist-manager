import React from 'react';

const ErrorMessage = ({ children }) => (
  <div color="danger" data-testid="error">
    {children}
  </div>
);

export default ErrorMessage;
