import * as React from "react";

export const ChevronDown = (): JSX.Element => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
    role="img"
    aria-label="Collapse file"
  >
    <path d="M4.427 6.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 6H4.604a.25.25 0 00-.177.427z" />
  </svg>
);

export const ChevronRight = (): JSX.Element => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
    role="img"
    aria-label="Expand file"
  >
    <path d="M6.427 4.427l3.396 3.396a.25.25 0 010 .354l-3.396 3.396A.25.25 0 016 11.396V4.604a.25.25 0 01.427-.177z" />
  </svg>
);

export const ChevronUp = (): JSX.Element => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
    role="img"
    aria-label="Expand file"
  >
    <path d="M11.573 9.573l-3.396-3.396a.25.25 0 00-.354 0l-3.396 3.396A.25.25 0 004.604 10h6.792a.25.25 0 00.177-.427z" />
  </svg>
);
