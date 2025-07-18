import React, { FC } from 'react';

const PlaylistIcon: FC<React.SVGProps<SVGSVGElement>> = props => {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        className="fill-inherit"
        d="M13 16.493C13 18.427 14.573 20 16.507 20s3.507-1.573 3.507-3.507c0-.177-.027-.347-.053-.517H20V6h2V4h-3a1 1 0 0 0-1 1v8.333a3.465 3.465 0 0 0-1.493-.346A3.51 3.51 0 0 0 13 16.493zM2 5h14v2H2z"
      />
      <path className="fill-inherit" d="M2 9h14v2H2zm0 4h9v2H2zm0 4h9v2H2z" />
    </svg>
  );
};

export default PlaylistIcon;
