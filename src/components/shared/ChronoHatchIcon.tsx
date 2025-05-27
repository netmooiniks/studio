
import type { SVGProps } from 'react';

export function ChronoHatchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props} // Spread props to allow overriding width, height, and adding className
    >
      <path d="M32 5.33331C17.28 5.33331 5.33337 17.28 5.33337 32C5.33337 46.72 17.28 58.6666 32 58.6666C46.72 58.6666 58.6667 46.72 58.6667 32C58.6667 17.28 46.72 5.33331 32 5.33331ZM32 53.3333C20.1867 53.3333 10.6667 43.8133 10.6667 32C10.6667 20.1866 20.1867 10.6666 32 10.6666C43.8134 10.6666 53.3334 20.1866 53.3334 32C53.3334 43.8133 43.8134 53.3333 32 53.3333Z" fill="currentColor"/>
      <path d="M33.3333 16H30.6666V33.3333H45.3333V30.6666H33.3333V16Z" fill="currentColor"/>
      <path d="M41.5133 43.5066L39.6266 41.62L42.6666 38.58L44.5533 40.4666L41.5133 43.5066Z" fill="currentColor"/>
      <path d="M22.4467 40.4666L20.56 38.58L23.6 35.54L25.4867 37.4266L22.4467 40.4666Z" fill="currentColor"/>
      <path d="M43.7333 24.2666L41.8466 22.38L44.8866 19.34L46.7733 21.2266L43.7333 24.2666Z" fill="currentColor"/>
      <path d="M20.2267 21.2266L18.34 19.34L21.38 16.3L23.2667 18.1866L20.2267 21.2266Z" fill="currentColor"/>
    </svg>
  );
}
