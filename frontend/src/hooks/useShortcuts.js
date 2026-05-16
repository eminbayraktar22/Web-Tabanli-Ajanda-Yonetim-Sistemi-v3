import { useEffect } from 'react';

const useShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Input veya Textarea içindeysek kısayolları yoksay
      const activeTag = document.activeElement.tagName.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || document.activeElement.isContentEditable;
      
      if (isInput) return;

      const key = event.key.toLowerCase();
      
      if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key](event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export default useShortcuts;
