import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TitleBar from '../components/Navigation/TitleBar';
import BackgroundButton from '../components/Elements/BackgroundButton';
import AddSubject from '../components/Subject/AddSubject';
import { fetchSubjects, saveSubject, removeSubject } from '../components/Subject/SubjectManipulation';
import { fetchCollections, removeCollection } from '../components/Collections/CollectionManipulation';
import { useUser } from '../UserContext';
import SubjectBlock from '../components/Subject/SubjectBlock';
import Modal from '../components/Modal/Modal';
import CustomModal from '../components/Modal/CustomModal';
import CollectionBlock from '../components/Collections/CollectionBlock';
import AddBar from '../components/Navigation/AddBar';
import AddCollection from '../components/Collections/AddCollection';
import { saveCollection } from '../components/Collections/CollectionManipulation';
import DashboardImage from '../images/tutorial/Dashboard.png';
import { ChevronDown, Search } from 'lucide-react';

function Dashboard() {
  const [subjects, setSubjects] = useState([]);
  const [collections, setCollections] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingCollection, setEditingCollection] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCollectionDeleteModalOpen, setIsCollectionDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSort, setSelectedSort] = useState('Most Cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState(null);

  const [dashboardPopUp, setDashboardPopUp] = useState(false);

  const navigate = useNavigate();
  const { user, loading: userLoading, theme, popupStates, updatePopupState  } = useUser();
  const { secondaryColor, shadow, primaryColor, textClass } = theme;  // Get the secondary color

  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!user) {
      navigate('/');
      return;
    }

    if (!popupStates?.dashboard_popup) {
      setDashboardPopUp(true); 
    }

    const loadData = async () => {
      setLoading(true);
      const [subjectsData, collectionsData] = await Promise.all([
        fetchSubjects(user.id),
        fetchCollections(user.id),
      ]);
      setSubjects(subjectsData);
      setCollections(collectionsData);
      setLoading(false);
    };

    loadData();
  }, [user, userLoading, navigate, popupStates?.dashboard_popup]);

  const handleDismissPopup = () => {
    setDashboardPopUp(false); 
    updatePopupState("dashboard_popup", true); // Update Supabase
};

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
    setIsModalOpen(false);
  };

  const handleAddSubject = () => {
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const confirmDeleteSubject = (subject) => {
    setSubjectToDelete(subject);
    setIsDeleteModalOpen(true);
  };

  const handleRemoveSubject = async (subjectId) => {
    const success = await removeSubject(subjectId);
    if (success) {
      setSubjects(subjects.filter((subject) => subject.id !== subjectId));
    }
    setIsDeleteModalOpen(false);
  };

  // Collections
  const handleAddCollection = () => {
    setEditingCollection(null);
    setIsCollectionModalOpen(true);
  };

  const handleEditCollection = (collection) => {
    setEditingCollection(collection);
    setIsCollectionModalOpen(true);
  };

  const handleSaveCollection = async (id, userId, collectionName) => {
    const data = await saveCollection(id, userId, collectionName);
    if (data && !id) {
      // Add new collection to the collections array
      setCollections([...collections, ...data]);
    } else {
      // Update the existing collection in the collections array
      const updatedCollections = collections.map((collection) =>
        collection.id === id ? { ...collection, name: collectionName } : collection
      );
      setCollections(updatedCollections);
    }
    setIsCollectionModalOpen(false);
  };

  const confirmDeleteCollection = (collection) => {
    setCollectionToDelete(collection);
    setIsCollectionDeleteModalOpen(true);
  };

  const handleRemoveCollection = async (collectionId) => {
    const success = await removeCollection(collectionId);
    if (success) {
      setCollections(collections.filter((collection) => collection.id !== collectionId));
    }
    setIsCollectionDeleteModalOpen(false);
  };

  // Apply search and sorting to subjects and collections
  const sortedSubjects = [...subjects]
    .filter((subject) => subject.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Attach subjects to their collections
  const collectionsWithSubjects = collections.map((collection) => ({
    ...collection,
    subjects: sortedSubjects.filter((subject) => subject.collection_id === collection.id),
  }));

  // Combine collections and unassigned subjects into a single array
  const combinedList = [
    ...sortedSubjects.filter(subject => !subject.collection_id).map(subject => ({ ...subject, type: 'subject' })),
    ...collectionsWithSubjects.map(collection => ({ ...collection, type: 'collection' }))
  ];

  // Sort the combined list based on the selected sort option
  const sortedCombinedList = combinedList.sort((a, b) => {
    if (selectedSort === 'Alphabetical') {
      return a.name.localeCompare(b.name);
    } else if (selectedSort === 'Most Cards') {
      const aCount = a.type === 'subject' ? a.flashcard_count : a.subjects.length;
      const bCount = b.type === 'subject' ? b.flashcard_count : b.subjects.length;
      const countDiff = bCount - aCount;
      return countDiff === 0 ? a.name.localeCompare(b.name) : countDiff;
    } else if (selectedSort === 'Date Created') {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    return 0;
  });

  // Separate the sorted list back into collections and subjects
  const sortedCollections = sortedCombinedList.filter(item => item.type === 'collection');
  const sortedUnassignedSubjects = sortedCombinedList.filter(item => item.type === 'subject');

  const handleCollectionClick = (collectionId) => {
    setSelectedCollection((prev) => (prev === collectionId ? null : collectionId));
  };

  return (
    <div className="w-screen h-[100dvh] overflow-auto bg-cover bg-screen" style={{ backgroundImage: theme ? theme.image : ''}}>
      {/* Header Section */}
      <TitleBar text="Dashboard" user={user}
        content={
          <div className="block">
            <AddBar text="Add" addSub={handleAddSubject} addCol={handleAddCollection}/>
          </div>
        }
      />

      {/* Controls Section */}
      <ControlSection searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedSort={selectedSort} setSelectedSort={setSelectedSort} shadow={shadow} themeCol={theme ? secondaryColor : 'bg-gray-500 hover:bg-gray-600'} themeText={textClass}/>

      {/* Main Content Section */}
      {loading ? (
        // Loading State
        <DashboardLoading />
      ) : subjects.length > 0 || collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 py-4 px-5 sm:p-4 gap-4">
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
              onRemoveSubject={confirmDeleteSubject}
              onEditCollection={handleEditCollection}
              onRemoveCollection={confirmDeleteCollection}
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
              onRemoveSubject={() => confirmDeleteSubject(subject)}
            />
          ))}
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
            />
          </div>
        </div>
      )}

      {/* Add/Edit Subject Modal */}
      <AddSubject
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSubject}
        subject={editingSubject}    // Passes editingSubject to the modal
        text={editingSubject ? 'Edit Subject' : 'Add New Subject'}
        user={user}
      />

      {/* Delete Confirmation Modal - Subject */}
      <Modal
        isOpen={isDeleteModalOpen}
        onFirstAction={() => setIsDeleteModalOpen(false)}
        onSecondAction={() => handleRemoveSubject(subjectToDelete.id)}
        text="Delete Subject"
        mainText="This will also delete all cards associated with the subject."
        firstActionText="Cancel"
        secondActionText="Delete"
      />

      {/* Delete Confirmation Modal - Collection */}
      <Modal
        isOpen={isCollectionDeleteModalOpen}
        onFirstAction={() => setIsCollectionDeleteModalOpen(false)}
        onSecondAction={() => handleRemoveCollection(collectionToDelete.id)}
        text="Delete Collection"
        mainText="This will NOT delete the subjects associated with the collection."
        firstActionText="Cancel"
        secondActionText="Delete"
      />

      <AddCollection 
        isOpen={isCollectionModalOpen}
        user={user}
        collection={editingCollection}
        onSave={handleSaveCollection}
        onClose={() => setIsCollectionModalOpen(false)}
        text={editingCollection ? 'Edit Collection' : 'Add New Collection'}
      />

      {/* Tooltip */}
      <CustomModal
        isOpen={dashboardPopUp}
        content={
          <div className="text-left">
            <p className="text-2xl font-semibold mb-6">This is Dashboard</p>
            <div className="flex items-center h-full">
              <div className="w-[40%]">
                  <img src={DashboardImage} alt="Home Tutorial" className="w-full" />
              </div>
              <div className="w-2/3 flex items-center">
              <p className="text-lg text-gray-500 dark:text-gray-200">Dashboard shows all of your flashcards, organised into Subjects and Collections 
                <br></br><br></br>
                  <li>Subjects can be given a colour and a name, and can also be attached to a Collections. You can always move Subjects between or out of Collections</li>
                  <li>You can search and filter your Subjects and Collections</li>
                  <li>To get started, click Create New Subject. You can add more Subjects and Collections by clicking Add in the top right corner</li>
                  
                  </p>
              </div>
            </div>
          </div>
        }
        firstActionText={'Got it!'}
        firstActionCol={theme ? `${primaryColor.bgClass} ${primaryColor.hoverClass}` : 'bg-green-500 hover:bg-green-400'}
        onFirstAction={handleDismissPopup}
      />
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
                <option value="Date Created">Date Created</option>
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
          className={`transition-all duration-300 ease-in-out ${
            activeSection === 'search' ? 'w-4/5' : 'w-10'
          }`}
        >
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
              <option value="Date Created">Date Created</option>
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