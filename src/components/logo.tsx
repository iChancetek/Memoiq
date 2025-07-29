import type {SVGProps} from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
      <path d="M12 7v5l3 3" />
      <path d="M15.243 15.243l-1.414 1.414" />
      <path d="M8.757 15.243l1.414 1.414" />
    </svg>
  );
}
