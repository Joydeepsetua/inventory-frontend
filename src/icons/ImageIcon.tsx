import type { SVGProps } from "react";

export default function ImageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="m3.5 17 4.6-4.6a2 2 0 0 1 2.8 0l3 3" />
      <path d="m14.5 14 1.6-1.6a2 2 0 0 1 2.8 0L21 14.5" />
    </svg>
  );
}
