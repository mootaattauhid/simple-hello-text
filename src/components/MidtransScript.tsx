
import { useEffect } from 'react';

const MidtransScript = () => {
  useEffect(() => {
    // Check if script already exists
    if (document.querySelector('script[src*="snap.js"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', 'SB-Mid-client-wUSl3kzaq68k75u7JXtznOBq'); // Replace with your actual client key
    script.async = true;
    
    script.onload = () => {
      console.log('Midtrans Snap script loaded');
    };
    
    script.onerror = () => {
      console.error('Failed to load Midtrans Snap script');
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove script on unmount as it might be needed by other components
    };
  }, []);

  return null;
};

export default MidtransScript;
