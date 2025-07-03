import React from 'react';
import { useUser } from '../UserContext';

const SubscriptionStatus = () => {
  const { profile, upgradeToPro, manageBilling } = useUser();

  if (!profile) return null;

  const isPro = profile.pro;
  const endDate = profile.subscription_period_end;

  // Helper function to format timezone-aware date
  const formatSubscriptionDate = (dateString) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    
    // Display in user's local timezone
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  // Calculate subscription status
  const getSubscriptionStatus = () => {
    if (!endDate) return null;
    
    const now = new Date();
    const end = new Date(endDate);
    const daysUntilRenewal = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    return {
      date: end,
      daysUntilRenewal,
      isExpiringSoon: daysUntilRenewal <= 7 && daysUntilRenewal > 0,
      isExpired: daysUntilRenewal <= 0
    };
  };

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Subscription Status</h3>
      
      {isPro ? (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Pro Plan
            </span>
            {subscriptionStatus?.isExpiringSoon && (
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                Expires Soon
              </span>
            )}
          </div>
          
          {subscriptionStatus && (
            <div className="text-gray-600">
              {subscriptionStatus.isExpired ? (
                <p className="text-red-600 font-medium">Subscription expired</p>
              ) : (
                <div>
                  <p>
                    Renews on: <span className="font-medium">{formatSubscriptionDate(endDate)}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    ({subscriptionStatus.daysUntilRenewal} days remaining)
                  </p>
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={manageBilling}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Manage Billing
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center">
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
              Free Plan
            </span>
          </div>
          
          <p className="text-gray-600">
            Upgrade to Pro for unlimited features and premium content!
          </p>
          
          <button
            onClick={upgradeToPro}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
          >
            Upgrade to Pro
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus; 