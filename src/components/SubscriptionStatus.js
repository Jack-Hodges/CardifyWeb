import React from 'react';
import { useUser } from '../UserContext';

/** Plan badge only — Stripe billing is temporarily disabled. */
const SubscriptionStatus = () => {
  const { profile } = useUser();

  if (!profile) return null;

  const isPro = profile.pro;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Subscription Status</h3>

      {isPro ? (
        <div className="space-y-3">
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Pro Plan
          </span>
          <p className="text-gray-600 text-sm">
            Billing is managed manually while Stripe is disabled.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
            Free Plan
          </span>
          <p className="text-gray-600 text-sm">
            Want Pro? Email{' '}
            <a
              href="mailto:hello@flashcardify.app"
              className="text-blue-600 font-semibold underline"
            >
              hello@flashcardify.app
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;
