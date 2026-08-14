import supabase from '../supabaseClient';

async function callAdminRpc(fn, params) {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) throw error;
  return data;
}

export function fetchAdminOverview() {
  return callAdminRpc('get_admin_overview');
}

export function searchAdminUsers(search = '', { limit = 25, offset = 0 } = {}) {
  return callAdminRpc('admin_search_users', {
    p_search: search || null,
    p_limit: limit,
    p_offset: offset,
  });
}

export function updateAdminUser(userId, { pro, unlimited, admin } = {}) {
  return callAdminRpc('admin_update_user', {
    p_user_id: userId,
    p_pro: pro ?? null,
    p_unlimited: unlimited ?? null,
    p_admin: admin ?? null,
  });
}

export function resetAdminGeneration(userId) {
  return callAdminRpc('admin_reset_generation', { p_user_id: userId });
}

export function recalcAdminFlashcardCount(userId) {
  return callAdminRpc('admin_recalc_flashcard_count', { p_user_id: userId });
}

export function listAdminUserSubjects(userId) {
  return callAdminRpc('admin_list_user_subjects', { p_user_id: userId });
}

export function unpublishAdminSubject(subjectId) {
  return callAdminRpc('admin_unpublish_subject', { p_subject_id: subjectId });
}
