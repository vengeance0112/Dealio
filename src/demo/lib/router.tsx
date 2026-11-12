import { useEffect, useState, type AnchorHTMLAttributes } from 'react';

const read = () => window.location.hash.replace(/^#/, '') || '/';

export function usePath() {
  const [p, setP] = useState('/');
  useEffect(() => {
    const h = () => {
      setP(read());
      window.scrollTo(0, 0);
    };
    h();
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  return p;
}

export const go = (to: string) => {
  window.location.hash = to;
};

export function Link({ to, ...rest }: { to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a href={'#' + to} {...rest} />;
}

export function match(pattern: string, path: string): Record<string, string> | null {
  const pp = pattern.split('/');
  const ps = path.split('?')[0]!.split('/');
  if (pp.length !== ps.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    const a = pp[i]!;
    const b = ps[i]!;
    if (a.startsWith(':')) params[a.slice(1)] = decodeURIComponent(b);
    else if (a !== b) return null;
  }
  return params;
}
