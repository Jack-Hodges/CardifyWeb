/**
 * Hydrate subject from route param when location.state is missing (refresh / deep link).
 * Stable across tab focus — only refetches when the subjectId in the URL changes.
 */
import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import supabase from '../supabaseClient';

export function useSubjectFromRoute() {
  const { subjectId } = useParams();
  const location = useLocation();
  const stateSubject = location.state?.subject || null;
  const [subject, setSubject] = useState(() => {
    if (stateSubject) return stateSubject;
    return null;
  });
  const [loading, setLoading] = useState(() => Boolean(subjectId) && !stateSubject);

  useEffect(() => {
    const fromState = location.state?.subject;
    if (fromState && (!subjectId || String(fromState.id) === String(subjectId))) {
      setSubject(fromState);
      setLoading(false);
      return;
    }

    if (!subjectId) {
      setSubject(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      // Keep current subject visible while refetching the same id — no loading flicker
      setSubject((prev) => {
        if (prev && String(prev.id) === String(subjectId)) return prev;
        setLoading(true);
        return prev;
      });

      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .is('deleted_at', null)
        .maybeSingle();

      if (!cancelled) {
        if (error) console.error('useSubjectFromRoute', error);
        setSubject(data || null);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Only the URL param — not location.state object identity (avoids remount on focus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  return { subject, loadingSubject: loading, subjectId };
}

export default useSubjectFromRoute;
