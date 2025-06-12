import { useState } from 'react';

export default function useModals(initial = {}) {
  const [modals, setModals] = useState(initial);

  const openModal  = name => setModals(m => ({ ...m, [name]: true }));
  const closeModal = name => setModals(m => ({ ...m, [name]: false }));
  const toggleModal= name => setModals(m => ({ ...m, [name]: !m[name] }));

  return { modals, openModal, closeModal, toggleModal };
}