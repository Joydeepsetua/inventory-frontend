import type { SVGProps } from "react";

export default function InvoiceIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M6 2.5h9l4 4V21l-2.2-1.3L14.6 21l-2.3-1.3L10 21l-2.3-1.3L5.5 21V4a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M9 8.5h6M9 12.5h6" />
    </svg>
  );
}
