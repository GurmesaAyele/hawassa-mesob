import React from 'react';
import { Link } from 'react-router-dom';

const Card = ({ 
  children, 
  className = '', 
  hover = false,
  interactive = false,
  to,
  onClick,
  padding = 'default',
  ...props 
}) => {
  const baseStyles = 'card';
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  const classes = `
    ${baseStyles}
    ${paddingStyles[padding]}
    ${hover ? 'card-hover' : ''}
    ${interactive ? 'card-interactive' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div 
        onClick={onClick} 
        className={`${classes} cursor-pointer`}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick(e);
          }
        }}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
