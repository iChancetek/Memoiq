import type {SVGProps} from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" className="opacity-20" />
      <path d="M12 7v5l3 3" className="text-primary" />
      <circle cx="12" cy="12" r="10" className="stroke-primary/30" />
      <path d="M12 2a10 10 0 0 1 10 10" className="text-primary animate-pulse" />
    </svg>
  );
}