import React from 'react';
import GlassSurface from './GlassSurface';

const GlassButton = ({
  children,
  className = '',
  style = {},
  onClick,
  disabled,
  variant = 'primary', // 'primary' or 'secondary'
  width = '100%',
  height = '54px',
  borderRadius = 16, // Consistent 16px rounded corners
  ...props
}) => {
  const isPrimary = variant === 'primary';

  // Read dimensions from style if provided, otherwise fall back to props
  const finalWidth = style.width || width;
  const finalHeight = style.height || height;

  // Custom displacement properties for GlassSurface
  const glassProps = isPrimary
    ? {
        brightness: 75,
        opacity: 0.95,
        backgroundOpacity: 0.2,
        borderRadius: borderRadius,
        distortionScale: -100,
        saturation: 1.3,
      }
    : {
        brightness: 45,
        opacity: 0.9,
        backgroundOpacity: 0.05,
        borderRadius: borderRadius,
        distortionScale: -150,
        saturation: 1.15,
      };

  // Keep display styles (like flex, grid, margin) on the outer container, 
  // and dimensions on the outer container.
  const { width: _w, height: _h, ...restStyle } = style;

  return (
    <GlassSurface
      width={finalWidth}
      height={finalHeight}
      className={`glass-btn glass-btn--${variant} ${disabled ? 'glass-btn--disabled' : ''} ${className}`}
      style={{
        ...restStyle,
        opacity: disabled ? 0.45 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
      }}
      {...glassProps}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`btn-${variant}`}
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          margin: 0,
          padding: 0,
          cursor: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        }}
        {...props}
      >
        {children}
      </button>
    </GlassSurface>
  );
};

export default GlassButton;
