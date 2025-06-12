import React, { FC } from 'react';

const ArtistIcon: FC<React.SVGProps<SVGSVGElement>> = props => {
  return (
    <svg viewBox="0 0 24 25" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill="inherit" clipPath="url(#clip0_429_11111)">
        <circle fill="inherit" cx="12" cy="7" r="3" strokeWidth="2.5" />
        <circle fill="inherit" cx="18" cy="18" r="2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path
          fill="inherit"
          d="M12.3414 20H6C4.89543 20 4 19.1046 4 18C4 15.7909 5.79086 14 8 14H13.5278"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path fill="inherit" d="M20 18V11L22 13" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_429_11111">
          <rect width="24" height="24" fill="inherit" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default ArtistIcon;
