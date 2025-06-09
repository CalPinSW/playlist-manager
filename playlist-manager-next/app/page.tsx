import React from 'react';

import Hero from '../components/Hero';
import Content from '../components/Content';

export default function Index() {
  return (
    <>
    <div className='text-5xl m-3 p-4'>Hellow World</div>
      <Hero />
      <hr />
      <Content />
    </>
  );
}
