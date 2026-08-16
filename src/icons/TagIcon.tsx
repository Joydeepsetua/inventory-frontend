import type { SVGProps } from "react";

export default function TagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
      {...props}
    >
      <path d="M11.6 3H4.5A1.5 1.5 0 0 0 3 4.5v7.1a1.5 1.5 0 0 0 .44 1.06l7.9 7.9a1.5 1.5 0 0 0 2.12 0l7.1-7.1a1.5 1.5 0 0 0 0-2.12l-7.9-7.9A1.5 1.5 0 0 0 11.6 3Z" />
      <circle cx="7.5" cy="7.5" r="1.4" />
    </svg>
  );
}
