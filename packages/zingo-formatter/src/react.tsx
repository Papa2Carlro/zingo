import React from 'react';
import { formatText, createZingoFormatter, ZingoFormatter } from './formatter.js';
import type { ZingoOptions } from './types.js';

// React Hook
export function useZingoFormatter(enabled: boolean, options?: ZingoOptions) {
  const formatter = createZingoFormatter(options);
  
  return (text: string) => {
    if (!enabled) return text;
    return formatter.format(text);
  };
}

// React Component Wrapper
export function ZingoText({ 
  children, 
  enabled = true, 
  intensity = 'medium',
  seed,
  className,
  ...props 
}: {
  children: React.ReactNode;
  enabled?: boolean;
  intensity?: ZingoOptions['intensity'];
  seed?: number;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  const format = useZingoFormatter(enabled, { intensity, seed });
  const text = typeof children === 'string' ? children : String(children);
  
  return (
    <span className={className} {...props}>
      {format(text)}
    </span>
  );
}

// HOC для компонентів
export function withZingoFormatter<P extends { children?: React.ReactNode }>(
  Component: React.ComponentType<P>,
  options?: ZingoOptions
) {
  return function WithZingoFormatter(props: P & { zingoEnabled?: boolean }) {
    const { zingoEnabled = true, children, ...rest } = props;
    const format = useZingoFormatter(zingoEnabled, options);
    
    // Перехоплюємо children і форматимо текстові ноди
    const formattedChildren = React.Children.map(children, child => {
      if (typeof child === 'string') return format(child);
      if (React.isValidElement(child)) {
        const childChildren = (child.props as any).children;
        if (typeof childChildren === 'string') {
          return React.cloneElement(child, {
            children: format(childChildren)
          } as any);
        }
      }
      return child;
    });
    
    return <Component {...(rest as P)} children={formattedChildren} />;
  };
}

// Vanilla JS helper
export function createVanillaFormatter(options?: ZingoOptions) {
  return createZingoFormatter(options);
}

// Auto-format для contenteditable / textarea
export function attachZingoFormatter(
  element: HTMLTextAreaElement | HTMLInputElement | HTMLElement,
  options?: ZingoOptions
) {
  const formatter = createZingoFormatter(options);
  let isComposing = false;
  
  const handleInput = () => {
    if (isComposing) return;
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      const cursorPos = element.selectionStart;
      const formatted = formatter.format(element.value);
      element.value = formatted;
      // Спроба відновити курсор (спрощено)
      element.setSelectionRange(cursorPos, cursorPos);
    } else if (element.isContentEditable) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      const text = range.toString();
      if (text) {
        const formatted = formatter.format(text);
        range.deleteContents();
        range.insertNode(document.createTextNode(formatted));
      }
    }
  };
  
  element.addEventListener('compositionstart', () => { isComposing = true; });
  element.addEventListener('compositionend', () => { isComposing = false; });
  element.addEventListener('input', handleInput);
  
  return () => {
    element.removeEventListener('input', handleInput);
    element.removeEventListener('compositionstart', () => { isComposing = true; });
    element.removeEventListener('compositionend', () => { isComposing = false; });
  };
}