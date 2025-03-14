import React, { useEffect } from 'react';

const GoogleAd = () => {
  useEffect(() => {
    // Dynamically push the AdSense script when the component mounts
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense Error:', err);
    }
  }, []);

  return (
    <div>
      {/* Google AdSense ad placeholder */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-5602754813123072"
        data-ad-slot="9450054611"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default GoogleAd;