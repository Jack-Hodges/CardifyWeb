-- Remove unused legacy store table (Discover uses subject_listings / subject_library)

DROP TABLE IF EXISTS public.store_subjects CASCADE;
