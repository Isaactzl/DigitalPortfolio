export const site = {
  name: 'Isaac Tan',
  role: 'Software & Automation Developer',
  location: 'Singapore',
  description:
    'Isaac Tan builds tools that take the busywork off people, and games his friends actually play. Junior developer in Singapore.',
  github: 'https://github.com/isaactzl',
  linkedin: 'https://www.linkedin.com/in/isaac-tan-zl/',
  email: 'isaac.tan0207@gmail.com',
  cv: 'cv/isaac-tan-cv.pdf',
};

/** Prefixes a site-relative path with the deploy base (`/DigitalPortfolio/`). */
export const url = (path = '') => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path}`;
