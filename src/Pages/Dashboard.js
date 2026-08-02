import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TitleBar from '../components/Navigation/TitleBar';
import BackgroundButton from '../components/Elements/BackgroundButton';
import AddSubject from '../components/Subject/AddSubject';
import { fetchSubjects, saveSubject, removeSubject, restoreSubject, dismissTutorialSubject, TUTORIAL_SUBJECT_ID } from '../components/Subject/SubjectManipulation';
import { toast } from '../components/Toast';
import { saveProfile } from '../components/Profile/ProfileManipulation';
import { fetchCollections, removeCollection } from '../components/Collections/CollectionManipulation';
import { useUser } from '../UserContext';
import SubjectBlock from '../components/Subject/SubjectBlock';
import ConfirmModal from '../components/Modals/ConfirmModal';
import CollectionBlock from '../components/Collections/CollectionBlock';
import AddBar from '../components/Navigation/AddBar';
import AddCollection from '../components/Collections/AddCollection';
import { saveCollection } from '../components/Collections/CollectionManipulation';
import { ChevronDown, Search, Trash2, CircleMinus } from 'lucide-react';
import useModals from '../hooks/useModals';
import { Helmet } from 'react-helmet-async';
import SpotlightTour from '../components/Tutorial/SpotlightTour';
import usePageTour from '../components/Tutorial/usePageTour';
import { DASHBOARD_STEPS } from '../components/Tutorial/tourSteps';
import { getThemeBackgroundStyle } from '../components/Functions/getTheme';

function Dashboard() {
  const [subjects, setSubjects] = useState([]);
  const [collections, setCollections] = useState([]);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingCollection, setEditingCollection] = useState(null);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSort, setSelectedSort] = useState('Most Cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState(null);

  const { modals, openModal, closeModal } = useModals({
    addSubject:        false,
    editSubject:       false,
    deleteSubject:     false,
    dismissTutorial:   false,
    addCollection:     false,
    editCollection:    false,
    deleteCollection:  false,
  });

  const mounted = useRef(false);

  const navigate = useNavigate();
  const { user, loading: userLoading, theme, profile, setProfile } = useUser();
  const { secondaryColor, shadow, textClass } = theme;  // Get the secondary color

  const tour = usePageTour({
    key: 'dashboard_popup',
    steps: DASHBOARD_STEPS,
    ready: !loading && !userLoading && Boolean(user),
  });

  const tourSubjectId = useMemo(() => {
    const tutorial = subjects.find((s) => s.id === TUTORIAL_SUBJECT_ID);
    if (tutorial) return tutorial.id;
    const firstOwn = subjects.find((s) => !s.isShared && !s.permission && !s.isFromDiscover);
    return firstOwn?.id ?? null;
  }, [subjects]);

  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!user) {
      navigate('/');
      return;
    }

    // Set initial sort preference from profile
    if (profile?.sort_preference !== undefined) {
      const sortOptions = ['Most Cards', 'Alphabetical', 'Date Created (Newest)', 'Date Created (Oldest)'];
      setSelectedSort(sortOptions[profile.sort_preference]);
    }

    // Only load data on initial mount
    if (!mounted.current) {
      const loadData = async () => {
        setLoading(true);
        const [subjectsData, collectionsData] = await Promise.all([
          fetchSubjects(user, profile),
          fetchCollections(user.id),
        ]);
        setSubjects(subjectsData);
        setCollections(collectionsData);
        setLoading(false);
      };

      loadData();
      mounted.current = true;
    }
  }, [user, userLoading, navigate, profile, profile?.sort_preference]);

  // Subject
  const handleSaveSubject = async (id, subjectName, subjectColor, subjectIntensity, up_to_index, collectionId, pinned) => {
    const data = await saveSubject(id, subjectName, subjectColor, subjectIntensity, user.id, up_to_index, collectionId, pinned);
    if (data && !id) {
      setSubjects([...subjects, ...data]);
    } else {
      const updatedSubjects = subjects.map((subject) =>
        subject.id === id
          ? { ...subject, name: subjectName, colourText: subjectColor, colourIntensity: subjectIntensity, collection_id: collectionId, pinned: pinned }
          : subject
      );
      setSubjects(updatedSubjects);
    }
    closeModal('addSubject');
    closeModal('editSubject');
  };

  const handleAddSubject = () => {
    setEditingSubject(null);
    openModal('addSubject');
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    openModal('editSubject');
  };

  const handleRemoveSubject = async (subjectId) => {
    const success = await removeSubject(subjectId);
    if (success) {
      setSubjects(subjects.filter((subject) => subject.id !== subjectId));

      toast.info(
        ({ closeToast }) => (
          <div className="flex items-center gap-3">
            <span>Subject deleted</span>
            <button
              type="button"
              className="underline font-bold text-blue-300 hover:text-blue-200"
              onClick={async () => {
                const restored = await restoreSubject(subjectId);
                if (restored) {
                  const refreshed = await fetchSubjects(user, profile);
                  setSubjects(refreshed);
                  toast.success('Subject restored');
                }
                closeToast();
              }}
            >
              Undo
            </button>
          </div>
        ),
        { autoClose: 10000 }
      );
    }
    closeModal('deleteSubject');
  };

  const handleDismissTutorialSubject = async () => {
    if (!profile) return;

    const success = await dismissTutorialSubject(profile);
    if (success) {
      setProfile({ ...profile, tutorial_subject: true });
      setSubjects(subjects.filter((subject) => subject.id !== TUTORIAL_SUBJECT_ID));
      toast.success('Sample subject removed');
    }
    closeModal('dismissTutorial');
  };

  // Collections
  const handleAddCollection = () => {
    setEditingCollection(null);
    openModal('addCollection');
  };

  const handleEditCollection = (collection) => {
    setEditingCollection(collection);
    openModal('editCollection');
  };

  const handleSaveCollection = async (id, userId, collectionName) => {
    const data = await saveCollection(id, userId, collectionName);
    if (data && !id) {
      setCollections([...collections, ...data]);
    } else {
      const updatedCollections = collections.map((collection) =>
        collection.id === id ? { ...collection, name: collectionName } : collection
      );
      setCollections(updatedCollections);
    }
    closeModal('addCollection');
    closeModal('editCollection');
  };

  const handleRemoveCollection = async (collectionId) => {
    const success = await removeCollection(collectionId);
    if (success) {
      setCollections(collections.filter((collection) => collection.id !== collectionId));
    }
    closeModal('deleteCollection');
  };

  // Apply search and sorting to subjects and collections
  const sortedSubjects = [...subjects]
    .filter((subject) => subject.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Split subjects into personal, shared, and Discover library
  const personalSubjects = sortedSubjects.filter(
    (subject) =>
      !subject.isFromDiscover &&
      (subject.user_id === user.id || subject.id === TUTORIAL_SUBJECT_ID)
  );
  const sharedSubjects = sortedSubjects.filter(
    (subject) =>
      !subject.isFromDiscover &&
      subject.user_id !== user.id &&
      subject.id !== TUTORIAL_SUBJECT_ID
  );
  const discoverSubjects = sortedSubjects.filter((subject) => subject.isFromDiscover);

  // Attach subjects to their collections and sort them
  const collectionsWithSubjects = collections.map((collection) => {
    const collectionSubjects = personalSubjects.filter((subject) => subject.collection_id === collection.id);
    
    // Sort subjects within the collection
    const sortedCollectionSubjects = [...collectionSubjects].sort((a, b) => {
      if (selectedSort === 'Alphabetical') {
        return a.name.localeCompare(b.name);
      } else if (selectedSort === 'Most Cards') {
        const countDiff = (b.flashcard_count || 0) - (a.flashcard_count || 0);
        return countDiff === 0 ? a.name.localeCompare(b.name) : countDiff;
      } else if (selectedSort === 'Date Created (Newest)') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (selectedSort === 'Date Created (Oldest)') {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      return 0;
    });

    return {
      ...collection,
      subjects: sortedCollectionSubjects
    };
  });

  // Combine collections and unassigned subjects into a single array
  const combinedList = [
    ...personalSubjects.filter(subject => !subject.collection_id).map(subject => ({ ...subject, type: 'subject' })),
    ...collectionsWithSubjects.map(collection => ({ ...collection, type: 'collection' }))
  ];

  // Sort the combined list based on the selected sort option
  const sortedCombinedList = combinedList.sort((a, b) => {
    if (selectedSort === 'Alphabetical') {
      return a.name.localeCompare(b.name);
    } else if (selectedSort === 'Most Cards') {
      const aCount = a.type === 'subject' ? (a.flashcard_count || 0) : a.subjects.length;
      const bCount = b.type === 'subject' ? (b.flashcard_count || 0) : b.subjects.length;
      const countDiff = bCount - aCount;
      return countDiff === 0 ? a.name.localeCompare(b.name) : countDiff;
    } else if (selectedSort === 'Date Created (Newest)') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (selectedSort === 'Date Created (Oldest)') {
      return new Date(a.created_at) - new Date(b.created_at);
    }
    return 0;
  });

  // Separate the sorted list back into collections and subjects
  const sortedCollections = sortedCombinedList.filter(item => item.type === 'collection');
  const sortedUnassignedSubjects = sortedCombinedList.filter(item => item.type === 'subject');

  const sortSubjectList = (list) =>
    [...list].sort((a, b) => {
      if (selectedSort === 'Alphabetical') {
        return a.name.localeCompare(b.name);
      } else if (selectedSort === 'Most Cards') {
        const countDiff = (b.flashcard_count || 0) - (a.flashcard_count || 0);
        return countDiff === 0 ? a.name.localeCompare(b.name) : countDiff;
      } else if (selectedSort === 'Date Created (Newest)') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (selectedSort === 'Date Created (Oldest)') {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      return 0;
    });

  const sortedSharedSubjects = sortSubjectList(sharedSubjects);
  const sortedDiscoverSubjects = sortSubjectList(discoverSubjects);

  const handleRemoveFromLibrary = (subjectId) => {
    setSubjects((current) => current.filter((subject) => subject.id !== subjectId));
    toast.success('Removed from library');
  };

  const handleCollectionClick = (collectionId) => {
    setSelectedCollection((prev) => (prev === collectionId ? null : collectionId));
  };

  const handleSortChange = async (newSort) => {
    setSelectedSort(newSort);
    // Map the sort option to the corresponding preference number
    const sortPreferenceMap = {
      'Most Cards': 0,
      'Alphabetical': 1,
      'Date Created (Newest)': 2,
      'Date Created (Oldest)': 3
    };
    
    // Save the new sort preference to the profile
    if (profile) {
      await saveProfile(
        profile.id,
        profile.first_name,
        profile.theme,
        sortPreferenceMap[newSort],
        profile.card_art,
        profile.generation_count
      );
    }
  };

  return (
    <div
      className="w-screen min-h-[100lvh] sm:h-screen relative bg-cover bg-center bg-no-repeat"
      style={{...getThemeBackgroundStyle(theme.image)}}
    >
      <Helmet>
        <title>Dashboard - Cardify | Manage Your Flashcard Collections</title>
        <meta name="description" content="Organise and manage all your flashcard subjects and collections in one place. Create, edit, search, and sort your study materials with Cardify's comprehensive dashboard." />
        <meta name="keywords" content="flashcard dashboard, study organization, flashcard management, study collections, learning materials organization" />
        <link rel="canonical" href="https://cardify.app/dashboard" />
        <meta property="og:title" content="Dashboard - Cardify" />
        <meta property="og:description" content="Organize and manage all your flashcard subjects and collections in one comprehensive dashboard." />
        <meta property="og:url" content="https://cardify.app/dashboard" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {/* Fixed background - ensure it covers entire viewport */}
      <div 
        className="hidden sm:block fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{...getThemeBackgroundStyle(theme.image)}}
      ></div>
      
      {/* Scrolling content */}
      <div className="relative z-10 min-h-[100lvh] sm:min-h-screen pb-20 px-1 sm:px-0">
        {/* Header Section */}
        <TitleBar text="Dashboard" user={user}
        content={
          <div className="block">
            <AddBar
              text="Add"
              addSub={handleAddSubject}
              addCol={handleAddCollection}
              dataTour={
                subjects.length > 0 || collections.length > 0
                  ? 'dashboard-create-subject'
                  : undefined
              }
            />
          </div>
        }
      />

      {/* Controls Section */}
      <div data-tour="dashboard-controls">
        <ControlSection searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedSort={selectedSort} setSelectedSort={handleSortChange} shadow={shadow} themeCol={theme ? secondaryColor : 'bg-gray-500 hover:bg-gray-600'} themeText={textClass}/>
      </div>

      {/* Main Content Section */}
      {loading ? (
        // Loading State
        <DashboardLoading />
      ) : subjects.length > 0 || collections.length > 0 ? (
        <div className="flex flex-col gap-6 py-4 px-5 sm:p-4">
          {/* Personal Subjects Section */}
          {(sortedCollections.length > 0 || sortedUnassignedSubjects.length > 0) && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
                {/* Render Collections with Subjects */}
                {sortedCollections.map((collection) => (
                  <CollectionBlock
                    key={collection.id}
                    user={user}
                    collection={collection}
                    subjects={collection.subjects}
                    isExpanded={selectedCollection === collection.id}
                    onClick={() => handleCollectionClick(collection.id)}
                    onEditSubject={handleEditSubject}
                    onRemoveSubject={(subject) => {
                      setSubjectToDelete(subject);
                      openModal('deleteSubject');
                    }}
                    onEditCollection={handleEditCollection}
                    onRemoveCollection={(collection) => {
                      setCollectionToDelete(collection);
                      openModal('deleteCollection');
                    }}
                    onSaveSubject={handleSaveSubject}
                  />
                ))}

                {/* Render Subjects Not in Any Collection */}
                {sortedUnassignedSubjects.map((subject) => (
                  <SubjectBlock
                    key={subject.id}
                    subject={subject}
                    user={user}
                    onSave={handleSaveSubject}
                    onEdit={() => handleEditSubject(subject)}
                    onRemoveSubject={() => {
                      setSubjectToDelete(subject);
                      openModal('deleteSubject');
                    }}
                    onDismissTutorial={() => openModal('dismissTutorial')}
                    tourTarget={subject.id === tourSubjectId}
                    forceActions={
                      tour.active &&
                      subject.id === tourSubjectId &&
                      tour.currentStep?.id === 'dashboard-subject-add'
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Shared Subjects Section */}
          {sortedSharedSubjects.length > 0 && (
            <div>
              <h2 className={`text-2xl font-bold mb-4 ${shadow ? 'drop-shadow-custom' : ''} ${theme ? theme.textClass : 'textColor'}`}>Shared with You</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
                {sortedSharedSubjects.map((subject) => (
                  <SubjectBlock
                    key={subject.id}
                    subject={subject}
                    user={user}
                    onSave={handleSaveSubject}
                    onEdit={() => handleEditSubject(subject)}
                    onRemoveSubject={() => {
                      setSubjectToDelete(subject);
                      openModal('deleteSubject');
                    }}
                    shared={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Discover library Section */}
          {sortedDiscoverSubjects.length > 0 && (
            <div>
              <h2 className={`text-2xl font-bold mb-4 ${shadow ? 'drop-shadow-custom' : ''} ${theme ? theme.textClass : 'textColor'}`}>From Discover</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
                {sortedDiscoverSubjects.map((subject) => (
                  <SubjectBlock
                    key={subject.id}
                    subject={subject}
                    user={user}
                    onSave={handleSaveSubject}
                    fromDiscover
                    onRemoveFromLibrary={handleRemoveFromLibrary}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // No Subjects or Collections Message
        <div className="flex flex-col justify-center items-center w-full h-4/5 gap-4">
          <p className={`${theme ? theme.textClass : 'textColor'} text-4xl font-bold text-center ${shadow ? 'drop-shadow-custom' : ''}`}>You have no subjects</p>
          <p className={`${theme ? theme.textClass : 'textColor'} text-2xl font-semibold text-center`}>In order to create flashcards, you need to create a subject first. 
            <br></br>Subjects organise your flashcards into groups, allowing you to edit and practice them in one go.
            <br></br>You can also create <span className="text-blue-500">Collections</span> to organise your subjects into different groups.
            <br></br>To add a subject, click the button below. You can also use the <span className="text-blue-500">Plus button</span> in the top right corner to create a subject or a collection.
          </p>
          <div className="block sm:flex gap-4 mt-5 items-center justify-center">
            <BackgroundButton
              text="Create New Subject"
              bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : 'bg-orange-500 hover:bg-orange-400'}
              onClick={handleAddSubject}
              wWidth="w-full sm:w-auto mb-3 sm:mb-0"
              dataTour="dashboard-create-subject"
            />
          </div>
        </div>
      )}

      {/* Add/Edit Subject Modal */}
      <AddSubject
        isOpen={modals.addSubject || modals.editSubject}
        onClose={() => {
          closeModal('addSubject');
          closeModal('editSubject');
        }}
        onSave={handleSaveSubject}
        subject={editingSubject}
        text={editingSubject ? 'Edit Subject' : 'Add New Subject'}
        user={user}
      />

      {/* Delete Confirmation Modal - Subject */}
      <ConfirmModal
        isOpen={modals.deleteSubject}
        onClose={() => closeModal('deleteSubject')}
        onConfirm={() => {
          const id = subjectToDelete?.id;
          closeModal('deleteSubject');
          if (id) handleRemoveSubject(id);
        }}
        title="Delete subject"
        message="This will also delete all cards associated with the subject."
        icon={<Trash2 size={20} />}
        confirmText="Delete"
      />

      <ConfirmModal
        isOpen={modals.dismissTutorial}
        onClose={() => closeModal('dismissTutorial')}
        onConfirm={handleDismissTutorialSubject}
        title="Remove sample subject"
        message="This removes the tutorial from your dashboard. The sample stays available for other users."
        icon={<CircleMinus size={20} />}
        confirmText="Remove"
      />

      {/* Delete Confirmation Modal - Collection */}
      <ConfirmModal
        isOpen={modals.deleteCollection}
        onClose={() => closeModal('deleteCollection')}
        onConfirm={() => {
          const id = collectionToDelete?.id;
          closeModal('deleteCollection');
          if (id) handleRemoveCollection(id);
        }}
        title="Delete collection"
        message="This will NOT delete the subjects associated with the collection."
        icon={<Trash2 size={20} />}
        confirmText="Delete"
      />

      <AddCollection 
        isOpen={modals.addCollection || modals.editCollection}
        user={user}
        collection={editingCollection}
        onSave={handleSaveCollection}
        onClose={() => {
          closeModal('addCollection');
          closeModal('editCollection');
        }}
        text={editingCollection ? 'Edit Collection' : 'Add New Collection'}
      />

      <SpotlightTour
        active={tour.active}
        step={tour.currentStep}
        stepIndex={tour.stepIndex}
        totalSteps={tour.totalSteps}
        isLast={tour.isLast}
        onNext={tour.next}
        onSkip={tour.skip}
      />
      </div>
    </div>
  );
}

export default Dashboard;

// Loading Component
function DashboardLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 2xl:grid-cols-6 p-4 gap-4">
      {/* Loading Skeletons */}
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="animate-pulse bg-gray-300 dark:bg-gray-600 h-56 w-full rounded-lg"></div>
      ))}
    </div>
  );
}

function ControlSection({
  selectedSort,
  setSelectedSort,
  searchTerm,
  setSearchTerm,
  shadow,
  themeCol,
  themeText = 'text-white'
}) {
  // 'filter' means the filter dropdown is fully shown and search is collapsed,
  // 'search' means the search input is expanded and filter is collapsed.
  const [activeSection, setActiveSection] = useState('filter');

  return (
    <>
      {/* Mobile version: visible on screens below the "sm" breakpoint */}
      <div className="flex mx-4 mt-3 items-center justify-between sm:hidden">
        {/* Filter Container */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            activeSection === 'filter' ? 'w-1/2' : 'w-10'
          }`}
        >
          {activeSection === 'filter' ? (
            // Expanded filter: just the select without an extra ChevronDown button.
            <div className="relative w-[90%]">
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className={`border-2 border-[rgba(3,15,64,1)] rounded-full pl-2 pr-8 background-shadow-new background-hover ${themeCol.bgClass} ${themeCol.hoverClass} text-white font-bold focus:outline-none h-10 w-full transition-colors duration-300 appearance-none`}
              >
                <option value="Most Cards">Most Cards</option>
                <option value="Alphabetical">Alphabetical</option>
                <option value="Date Created (Newest)">Date Created (Newest)</option>
                <option value="Date Created (Oldest)">Date Created (Oldest)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1">
                <ChevronDown className="w-5 h-5 text-white" />
              </div>
            </div>
          ) : (
            // Collapsed filter: only the ChevronDown button.
            <BackgroundButton
              image={<ChevronDown />}
              onClick={() => setActiveSection('filter')}
              bgColor={
                themeCol
                  ? `${themeCol.bgClass} ${themeCol.hoverClass}`
                  : 'bg-orange-500 hover:bg-orange-400'
              }
            />
          )}
        </div>

        {/* Search Container */}
        <div
          className={`relative transition-all duration-300 ease-in-out ${
            activeSection === 'search' ? 'w-4/5' : 'w-10'
          }`}
        >
          <div
            className={`absolute inset-0 rounded-full backdrop-blur-md bg-black/20 pointer-events-none transition-opacity duration-300 ${
              activeSection === 'search' ? 'opacity-100' : 'opacity-0'
            }`}
          ></div>
          {activeSection === 'search' ? (
            // Expanded search: full input.
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`h-10 px-4 py-2 text-left rounded-full ${themeCol.bgClass} ${themeText} background-shadow-new background-focus focus:outline-none w-full transition-all duration-300 placeholder-gray-200`}
              placeholder="Search subjects..."
            />
          ) : (
            // Collapsed search: only the magnifying glass button.
            <BackgroundButton
              image={<Search />}
              onClick={() => setActiveSection('search')}
              bgColor={
                themeCol
                  ? `${themeCol.bgClass} ${themeCol.hoverClass}`
                  : 'bg-orange-500 hover:bg-orange-400'
              }
            />
          )}
        </div>
      </div>

      {/* Desktop version: always show both controls fully */}
      <div className="hidden sm:flex mx-4 mt-3 items-center justify-between">
        <div className="flex gap-2">
          {/* Fully expanded filter dropdown */}
          <div className="relative group">
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className={`border-2 border-[rgba(3,15,64,1)] rounded-full pl-2 pr-8 background-shadow-new background-hover ${themeCol.bgClass} ${themeCol.hoverClass} text-white font-bold focus:outline-none h-10 cursor-pointer appearance-none w-full transition-colors duration-300`}
            >
              <option value="Most Cards">Most Cards</option>
              <option value="Alphabetical">Alphabetical</option>
              <option value="Date Created (Newest)">Date Created (Newest)</option>
              <option value="Date Created (Oldest)">Date Created (Oldest)</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1">
              <ChevronDown className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center w-1/4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full h-10 px-4 py-2 text-left rounded-full ${themeCol.bgClass} ${themeText} background-shadow-new background-focus focus:outline-none placeholder-gray-200`}
            placeholder="Search subjects..."
          />
        </div>
      </div>
    </>
  );
}