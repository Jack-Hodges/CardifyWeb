/** @typedef {'next' | 'target'} AdvanceOn */
/** @typedef {'top' | 'bottom' | 'left' | 'right' | 'center'} Placement */

/**
 * @typedef {Object} TourStep
 * @property {string} id
 * @property {string} [selector] - CSS selector; omit for centered tip with no spotlight
 * @property {string} title
 * @property {string} body
 * @property {Placement} [placement]
 * @property {AdvanceOn} [advanceOn]
 * @property {number} [advanceDelay] - ms to wait after a target click before advancing
 */

/** @type {TourStep[]} */
export const HOME_STEPS = [
  {
    id: 'home-welcome',
    title: 'Welcome to Cardify',
    body: 'Create flashcards, practice them, and track your progress. This quick tour shows the main pieces of Home.',
    placement: 'center',
    advanceOn: 'next',
  },
  {
    id: 'home-jump-in',
    selector: '[data-tour="home-jump-in"]',
    title: 'Jump In',
    body: 'Clicking a mode here opens a subject picker so you can jump straight into Create, Practice, or a game.',
    placement: 'bottom',
    advanceOn: 'next',
  },
  {
    id: 'home-subjects',
    selector: '[data-tour="home-subjects"]',
    title: 'Your subjects',
    body: 'Subjects you are learning show up here. Use View all or Go to Dashboard to manage them.',
    placement: 'top',
    advanceOn: 'next',
  },
  {
    id: 'home-nav',
    selector: '[data-tour="nav-menu"]',
    title: 'Open the menu',
    body: 'Click here to open the page menu — next you will go to Dashboard.',
    placement: 'bottom',
    advanceOn: 'target',
    advanceDelay: 350,
  },
  {
    id: 'home-nav-dashboard',
    selector: '[data-tour="nav-dashboard"]',
    title: 'Go to Dashboard',
    body: 'Click Dashboard to manage your subjects and create new ones.',
    placement: 'right',
    advanceOn: 'target',
  },
];

/** @type {TourStep[]} */
export const DASHBOARD_STEPS = [
  {
    id: 'dashboard-create',
    selector: '[data-tour="dashboard-create-subject"]',
    title: 'Create a subject',
    body: 'Clicking here starts a new subject — the folder that holds your flashcards.',
    placement: 'bottom',
    advanceOn: 'next',
  },
  {
    id: 'dashboard-controls',
    selector: '[data-tour="dashboard-controls"]',
    title: 'Search and sort',
    body: 'Find subjects by name and change how they are ordered.',
    placement: 'bottom',
    advanceOn: 'next',
  },
  {
    id: 'dashboard-subject',
    selector: '[data-tour="dashboard-subject"]',
    title: 'Subject actions',
    body: 'Subject actions (Practice, Add, Edit, Delete) appear on each subject card. On desktop, hover to reveal them; on mobile they stay visible.',
    placement: 'left',
    advanceOn: 'next',
  },
  {
    id: 'dashboard-subject-add',
    selector: '[data-tour="dashboard-subject-add"]',
    title: 'Add flashcards',
    body: 'Clicking Add opens Create for this subject so you can build cards.',
    placement: 'top',
    advanceOn: 'target',
  },
];

/** @type {TourStep[]} */
export const CREATE_STEPS = [
  {
    id: 'create-subject',
    selector: '[data-tour="create-pick-subject"]',
    title: 'Pick a subject',
    body: 'Choose an existing subject or create a new one before adding cards.',
    placement: 'bottom',
    advanceOn: 'next',
  },
  {
    id: 'create-add-card',
    selector: '[data-tour="create-add-card"]',
    title: 'Add a card',
    body: 'Clicking here opens the editor to add a question and answer pair.',
    placement: 'bottom',
    advanceOn: 'next',
  },
  {
    id: 'create-import',
    selector: '[data-tour="create-import"]',
    title: 'Import cards',
    body: 'Bulk-add flashcards from a file instead of typing them one by one.',
    placement: 'bottom',
    advanceOn: 'next',
  },
  {
    id: 'create-export',
    selector: '[data-tour="create-export"]',
    title: 'Export your cards',
    body: 'Download this subject as a printable PDF, or as CSV, JSON, or TXT for spreadsheets, backups, and re-importing later.',
    placement: 'bottom',
    advanceOn: 'next',
  },
  {
    id: 'create-flip',
    selector: '[data-tour="create-card-flip"]',
    title: 'Flip a card',
    body: 'Click the card to flip between the question and the answer.',
    placement: 'bottom',
    advanceOn: 'target',
  },
  {
    id: 'create-edit-pencil',
    selector: '[data-tour="create-edit-pencil"]',
    title: 'Edit this card',
    body: 'Click the pencil to open the editor and change the question or answer.',
    placement: 'left',
    advanceOn: 'target',
    advanceDelay: 350,
  },
  {
    id: 'create-edit-modes',
    selector: '[data-tour="create-edit-modes"]',
    title: 'Four content modes',
    body: 'Answers can be Text, Math (equations), Image, or Draw. Questions use Text or Math. These buttons above the answer field switch the mode.',
    placement: 'bottom',
    advanceOn: 'next',
  },
  {
    id: 'create-edit-close',
    selector: '[data-tour="create-edit-close"]',
    title: 'Close the editor',
    body: 'Click the X to close the editor and return to your cards.',
    placement: 'left',
    advanceOn: 'target',
    advanceDelay: 250,
  },
  {
    id: 'create-card-list',
    selector: '[data-tour="create-card-list"]',
    title: 'Browse your deck',
    body: 'All cards in this subject appear here. Click one to select it, or drag the grip handle to reorder.',
    placement: 'left',
    advanceOn: 'next',
  },
];

/** @type {TourStep[]} */
export const PRACTICE_STEPS = [
  {
    id: 'practice-pick',
    selector: '[data-tour="practice-pick-subject"]',
    title: 'Pick a subject',
    body: 'Choose which subject you want to practice.',
    placement: 'bottom',
    advanceOn: 'next',
  },
  {
    id: 'practice-mode',
    selector: '[data-tour="practice-mode"]',
    title: 'Study mode',
    body: 'Classic is one subject in order. Spaced is due cards from that subject. Mixed review pulls due cards from all your subjects. Then tap Start.',
    placement: 'bottom',
    advanceOn: 'next',
  },
  {
    id: 'practice-card',
    selector: '[data-tour="practice-card"]',
    title: 'Flip the card',
    body: 'Click or tap the card (or press Space) to flip between question and answer.',
    placement: 'bottom',
    advanceOn: 'next',
  },
  {
    id: 'practice-controls',
    selector: '[data-tour="practice-controls"]',
    title: 'Move through cards',
    body: 'Use these controls to go forward and back. In Spaced mode, rate Again / Hard / Good / Easy after you flip.',
    placement: 'top',
    advanceOn: 'next',
  },
];
