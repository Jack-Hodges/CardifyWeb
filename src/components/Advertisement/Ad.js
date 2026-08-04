import React, { useEffect, useRef } from 'react';

const GoogleAd = () => {
  const insRef = useRef(null);

  useEffect(() => {
    try {
      const el = insRef.current;
      if (!el) return;
      if (el.getAttribute('data-ad-status') === 'filled') return;

      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.warn('adsbygoogle.push() skipped:', err?.message || err);
    }
  }, []);

  return (
    <div>
      {/* Google AdSense ad placeholder */}
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-8881358709115240"
        data-ad-slot="9450054611"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default GoogleAd;