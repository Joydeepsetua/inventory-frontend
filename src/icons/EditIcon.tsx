import type { SVGProps } from "react";

export default function EditIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M12 20h7" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7.5 18.5 3.5 20l1.5-4Z" />
    </svg>
  );
}
