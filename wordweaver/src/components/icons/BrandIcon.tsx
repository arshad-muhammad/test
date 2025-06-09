import type { SVGProps } from 'react';

export function BrandIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M17.5 9.5C17.5 9.5 19 10.5 19 12.5C19 14.1569 17.6569 15.5 16 15.5C14.3431 15.5 13 14.1569 13 12.5C13 10.5 14.5 9.5 14.5 9.5M17.5 9.5C17.1556 9.5 16.5 8.5 16.5 8.5M17.5 9.5C17.8444 9.5 18.5 8.5 18.5 8.5M14.5 9.5C14.8444 9.5 15.5 8.5 15.5 8.5M14.5 9.5C14.1556 9.5 13.5 8.5 13.5 8.5M7 13.5L5 18L10 16.5L16.5 5.5L11.5 2L7 13.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 16.5L5 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 2L7 13.5L8.5 15L10 16.5L16.5 5.5L11.5 2Z"
        fill="currentColor"
        fillOpacity="0.2"
      />
    </svg>
  );
}
