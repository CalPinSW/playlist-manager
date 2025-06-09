import React from 'react';

import contentData from '../utils/contentData';

const Content = () => (
  <div className="next-steps my-5" data-testid="content">
    <h2 className="my-5 text-center" data-testid="content-title">
      What can I do next?
    </h2>
    <div className="flex fle-row d-flex justify-content-between" data-testid="content-items">
      {contentData.map((col, i) => (
        <div key={i} className="flex flex-col mb-4">
          <h6 className="mb-3">
            <a href={col.link}>
              {col.title}
            </a>
          </h6>
          <p>{col.description}</p>
        </div>
      ))}
    </div>
  </div>
);

export default Content;
