import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 20, className = "" }: IconProps) {
  return (
    <svg className={`nx-icon ${className}`} style={{ width: size, height: size }}>
      <use href={`${window.ps_plugin_url}assets/icons.svg#icon-${name}`} />
    </svg>
  );
}
