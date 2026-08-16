import React from 'react';

// Renders the official DStoma brand asset. The logo files in /public are the
// authoritative brand marks — they are never redrawn in CSS/SVG here, only
// placed and lit, so the identity stays pixel-identical to the brand source.
//
//   logo-full.png  — mark + "DStoma" wordmark (used in the header)
//   logo-mark.png  — mark only (the floating hologram subject)
//
// Both carry a real alpha channel. icon-*.png are deliberately NOT used here:
// those are the PWA launcher icons and are flattened onto opaque white, which
// would show up as a white card floating over the dark hologram scene.

interface Props {
  variant?: 'full' | 'mark';
  className?: string;
  /** Adds the ambient cyan bloom used in the header. */
  glow?: boolean;
  alt?: string;
}

export default function DStomaLogo({
  variant = 'full',
  className = '',
  glow = false,
  alt = 'DStoma',
}: Props) {
  const src = variant === 'full' ? '/logo-full.png' : '/logo-mark.png';

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`select-none object-contain ${className}`}
      style={
        glow
          ? { filter: 'drop-shadow(0 0 22px rgba(0, 200, 255, 0.35))' }
          : undefined
      }
    />
  );
}
