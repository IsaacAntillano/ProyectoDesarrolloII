import { useId, type ReactNode } from 'react';
import { FiHelpCircle } from 'react-icons/fi';

interface HelpTipProps {
  title: string;
  children: ReactNode;
}

/** Ayuda contextual colapsable: explica términos y consecuencias sin ruido visual. */
export default function HelpTip({ title, children }: HelpTipProps) {
  const id = useId();
  return (
    <details className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
      <summary
        id={id}
        className="flex cursor-pointer items-center gap-1.5 font-medium marker:text-blue-500 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500 [&:focus-visible]:ring-offset-1"
      >
        <FiHelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        {title}
      </summary>
      <div className="mt-2 space-y-1 text-blue-900/90">{children}</div>
    </details>
  );
}
