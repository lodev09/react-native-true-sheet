'use client';

import { useState } from 'react';
import styles from './page.module.css';

export function InstallCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={styles.install}>
      <code>{command}</code>
      <button type="button" onClick={copy} className={styles.copy} aria-label="Copy install command">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
