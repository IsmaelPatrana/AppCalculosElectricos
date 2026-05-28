import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
      {show && (
        <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-foreground text-background text-xs rounded-md shadow-lg">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground"></div>
        </div>
      )}
    </div>
  );
}
