import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Zap, Layers, Eye } from 'lucide-react';
import { useUser } from '../../UserContext';
import { fetchCards } from '../../components/Card/CardManipulation';
import SafeMarkdown from '../../components/Functions/SafeMarkdown';
import CardifyLogo from '../../images/Logos/CardifyLogoNoText.png';
import TitleBar from '../../components/Navigation/TitleBar';
import SubjectList from '../../components/Subject/SubjectList';
import NoSelectionModal from '../../components/Modals/NoSelectionModal';
import GameComplete from '../../components/Elements/GameComplete';
import LoadingSpinner from '../../components/Elements/LoadingSpinner';
import PageEmptyState from '../../components/Elements/PageEmptyState';
import GameSettings, {
  SettingStepper,
  SettingToggle,
} from '../../components/Games/GameSettings';
import useSubjectFromRoute from '../../hooks/useSubjectFromRoute';
import { getThemeBackgroundStyle } from '../../components/Functions/getTheme';

const MIN_CARDS = 2;
const DEFAULT_PAIRS_PER_ROUND = 6;
const PEEK_MS = 1600;
const MISMATCH_MS = 900;
const ROUND_TRANSITION_MS = 700;

function shuffleArray(array) {
  const next = [...array];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function buildTiles(batch) {
  return shuffleArray(
    batch.flatMap((card) => {
      const isImage = card.backMode === 2 || card.backMode === 3;
      return [
        {
          key: `${card.id}-front`,
          pairId: card.id,
          content: card.question,
          isImage: false,
        },
        {
          key: `${card.id}-back`,
          pairId: card.id,
          content: isImage ? card.image_url : card.answer,
          isImage,
        },
      ];
    })
  );
}

function getGridClass(tileCount) {
  if (tileCount <= 4) return 'grid-cols-2';
  if (tileCount <= 8) return 'grid-cols-2 sm:grid-cols-4';
  if (tileCount <= 10) return 'grid-cols-2 sm:grid-cols-5';
  if (tileCount <= 12) return 'grid-cols-3 sm:grid-cols-4';
  if (tileCount <= 16) return 'grid-cols-4';
  return 'grid-cols-3 sm:grid-cols-5';
}

function Memory() {
  const { subject } = useSubjectFromRoute();
  const { user, getUser, theme } = useUser();
  const { textClass, secondaryColor, shadow } = theme || {};
  const navigate = useNavigate();

  const [allCards, setAllCards] = useState([]);
  const [sessionCards, setSessionCards] = useState([]);
  const [cardCount, setCardCount] = useState(12);
  const [pairsPerRound, setPairsPerRound] = useState(DEFAULT_PAIRS_PER_ROUND);
  const [shuffle, setShuffle] = useState(true);
  const [peekEnabled, setPeekEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [tiles, setTiles] = useState([]);
  const [flippedKeys, setFlippedKeys] = useState([]);
  const [matchedPairIds, setMatchedPairIds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [totalRounds, setTotalRounds] = useState(1);
  const [isPeeking, setIsPeeking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [boardVisible, setBoardVisible] = useState(true);

  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [moves, setMoves] = useState(0);
  const [misses, setMisses] = useState(0);

  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);

  const flipTimeoutRef = useRef(null);
  const peekTimeoutRef = useRef(null);
  const roundTimeoutRef = useRef(null);
  const sessionCardsRef = useRef([]);
  const pairsPerRoundRef = useRef(DEFAULT_PAIRS_PER_ROUND);
  const roundIndexRef = useRef(0);
  const peekEnabledRef = useRef(true);

  const clearTimers = useCallback(() => {
    if (flipTimeoutRef.current) {
      clearTimeout(flipTimeoutRef.current);
      flipTimeoutRef.current = null;
    }
    if (peekTimeoutRef.current) {
      clearTimeout(peekTimeoutRef.current);
      peekTimeoutRef.current = null;
    }
    if (roundTimeoutRef.current) {
      clearTimeout(roundTimeoutRef.current);
      roundTimeoutRef.current = null;
    }
  }, []);

  const startRound = useCallback(
    (cards, index, perRound, withPeek) => {
      const start = index * perRound;
      const batch = cards.slice(start, start + perRound);
      setTiles(buildTiles(batch));
      setFlippedKeys([]);
      setMatchedPairIds([]);
      setIsProcessing(false);
      setBoardVisible(true);

      if (withPeek && batch.length > 0) {
        setIsPeeking(true);
        peekTimeoutRef.current = setTimeout(() => {
          setIsPeeking(false);
          peekTimeoutRef.current = null;
        }, PEEK_MS);
      } else {
        setIsPeeking(false);
      }
    },
    []
  );

  const subjectId = subject?.id ?? null;
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      getUser();
      return undefined;
    }

    if (!subjectId) {
      setAllCards([]);
      setLoading(false);
      clearTimers();
      setStarted(false);
      setFinished(false);
      setIsTimerRunning(false);
      setTiles([]);
      setFlippedKeys([]);
      setMatchedPairIds([]);
      setIsPeeking(false);
      setIsProcessing(false);
      setBoardVisible(true);
      sessionCardsRef.current = [];
      return undefined;
    }

    let cancelled = false;
    (async () => {
      // New subject — leave any in-progress game and return to settings
      clearTimers();
      setStarted(false);
      setFinished(false);
      setIsTimerRunning(false);
      setTiles([]);
      setFlippedKeys([]);
      setMatchedPairIds([]);
      setIsPeeking(false);
      setIsProcessing(false);
      setBoardVisible(true);
      setTimer(0);
      setMoves(0);
      setMisses(0);
      setSessionCards([]);
      sessionCardsRef.current = [];
      roundIndexRef.current = 0;

      setLoading(true);
      const data = await fetchCards(subjectId);
      if (cancelled) return;
      setAllCards(data);
      const total = data.length || MIN_CARDS;
      setCardCount(Math.max(MIN_CARDS, total));
      setPairsPerRound(Math.min(DEFAULT_PAIRS_PER_ROUND, Math.max(MIN_CARDS, total)));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getUser is unstable; userId/subjectId are the real triggers
  }, [subjectId, userId, clearTimers]);

  useEffect(() => {
    if (!isTimerRunning) return undefined;
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    setPairsPerRound((prev) => Math.min(prev, Math.max(2, cardCount)));
  }, [cardCount]);

  const handleStart = () => {
    clearTimers();
    let pool = [...allCards];
    if (shuffle) pool = shuffleArray(pool);
    const count = Math.min(cardCount, pool.length);
    pool = pool.slice(0, count);

    const perRound = Math.min(Math.max(2, pairsPerRound), pool.length);
    const rounds = Math.max(1, Math.ceil(pool.length / perRound));

    sessionCardsRef.current = pool;
    pairsPerRoundRef.current = perRound;
    roundIndexRef.current = 0;
    peekEnabledRef.current = peekEnabled;
    setSessionCards(pool);
    setTotalRounds(rounds);
    setRoundIndex(0);
    setTimer(0);
    setMoves(0);
    setMisses(0);
    setFinished(false);
    setStarted(true);
    setIsTimerRunning(true);
    startRound(pool, 0, perRound, peekEnabled);
  };

  const playAgain = () => {
    clearTimers();
    setStarted(false);
    setFinished(false);
    setIsTimerRunning(false);
    setTiles([]);
    setFlippedKeys([]);
    setMatchedPairIds([]);
    setIsPeeking(false);
    setIsProcessing(false);
    setBoardVisible(true);
  };

  const advanceOrFinish = (nextRoundIndex) => {
    const cards = sessionCardsRef.current;
    const perRound = pairsPerRoundRef.current;
    const rounds = Math.max(1, Math.ceil(cards.length / perRound));

    if (nextRoundIndex < rounds) {
      setBoardVisible(false);
      roundTimeoutRef.current = setTimeout(() => {
        roundIndexRef.current = nextRoundIndex;
        setRoundIndex(nextRoundIndex);
        startRound(cards, nextRoundIndex, perRound, peekEnabledRef.current);
        roundTimeoutRef.current = null;
      }, ROUND_TRANSITION_MS);
      return;
    }

    setIsTimerRunning(false);
    setBoardVisible(false);
    roundTimeoutRef.current = setTimeout(() => {
      setFinished(true);
      roundTimeoutRef.current = null;
    }, ROUND_TRANSITION_MS);
  };

  const handleCardClick = (tile) => {
    if (
      !started ||
      finished ||
      isProcessing ||
      isPeeking ||
      matchedPairIds.includes(tile.pairId) ||
      flippedKeys.includes(tile.key)
    ) {
      return;
    }

    if (flippedKeys.length >= 2) return;

    const nextFlipped = [...flippedKeys, tile.key];
    setFlippedKeys(nextFlipped);

    if (nextFlipped.length < 2) return;

    setMoves((prev) => prev + 1);
    setIsProcessing(true);

    const [firstKey, secondKey] = nextFlipped;
    const first = tiles.find((t) => t.key === firstKey);
    const second = tiles.find((t) => t.key === secondKey);

    if (first && second && first.pairId === second.pairId && first.key !== second.key) {
      const nextMatched = [...matchedPairIds, first.pairId];
      setMatchedPairIds(nextMatched);
      setFlippedKeys([]);
      setIsProcessing(false);

      const pairsThisRound = tiles.length / 2;
      if (nextMatched.length >= pairsThisRound) {
        advanceOrFinish(roundIndexRef.current + 1);
      }
      return;
    }

    setMisses((prev) => prev + 1);
    flipTimeoutRef.current = setTimeout(() => {
      setFlippedKeys([]);
      setIsProcessing(false);
      flipTimeoutRef.current = null;
    }, MISMATCH_MS);
  };

  const pairsInRound = tiles.length / 2;
  const matchesInRound = matchedPairIds.length;
  const accuracy =
    moves > 0 ? Math.round(((moves - misses) / moves) * 100) : 100;

  const textTone = textClass || 'textColor';

  return (
    <div
      className="w-screen min-h-[100lvh] sm:h-screen relative bg-cover bg-center bg-no-repeat"
      style={{ ...getThemeBackgroundStyle(theme.image) }}
    >
      <div
        className="hidden sm:block fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{ ...getThemeBackgroundStyle(theme.image) }}
      />

      <div className="relative z-10 min-h-[100lvh] sm:h-screen flex flex-col sm:overflow-hidden">
        <TitleBar text="Memory" />

        {loading ? (
          <LoadingSpinner text="Shuffling cards..." />
        ) : !subject ? (
          <PageEmptyState>
            <NoSelectionModal
              text="No subject selected"
              subtext="Pick a subject to start playing Memory."
              text1="Select a subject to practice"
              action1={() => setIsSubjectListModalOpen(true)}
            />
          </PageEmptyState>
        ) : allCards.length < MIN_CARDS ? (
          <PageEmptyState>
            <NoSelectionModal
              text={`Need at least ${MIN_CARDS} flashcards to play`}
              subtext={`Add more cards to ${subject.name} to start a Memory game.`}
              text1={`Add More Flashcards to ${subject.name}`}
              action1={() => navigate(`/create/${subject.id}`, { state: { subject } })}
            />
          </PageEmptyState>
        ) : finished ? (
          <GameComplete
            title={`You finished in ${formatTime(timer)}!`}
            primaryText="Back to Home"
            onPrimary={() => navigate('/home')}
            secondaryText="Play again"
            onSecondary={playAgain}
          >
            <p className={`${textTone} text-xl font-semibold`}>
              Moves: {moves} · Misses: {misses} · Accuracy: {accuracy}%
            </p>
            <p className={`${textTone} text-base opacity-80 mt-2`}>
              {sessionCards.length} pair{sessionCards.length === 1 ? '' : 's'} ·{' '}
              {totalRounds} round{totalRounds === 1 ? '' : 's'}
            </p>
          </GameComplete>
        ) : !started ? (
          <PageEmptyState>
            <GameSettings
              cardCount={cardCount}
              setCardCount={setCardCount}
              maxCards={allCards.length}
              shuffle={shuffle}
              setShuffle={setShuffle}
              showTimer={false}
              onStart={handleStart}
            >
              <SettingStepper
                label="Pairs per round"
                value={pairsPerRound}
                min={2}
                max={Math.min(8, cardCount, allCards.length)}
                onChange={setPairsPerRound}
              />
              <SettingToggle
                label="Peek at round start"
                description="Briefly show all cards before each round"
                checked={peekEnabled}
                onChange={setPeekEnabled}
              />
            </GameSettings>
          </PageEmptyState>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col px-3 sm:px-5 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className={`flex items-center gap-4 ${textTone}`}>
                <div className="flex items-center gap-1.5">
                  <Timer className="w-5 h-5" />
                  <span className="text-lg font-semibold tabular-nums">
                    {formatTime(timer)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-5 h-5" />
                  <span className="text-lg font-semibold">{moves}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-5 h-5" />
                  <span className="text-lg font-semibold">
                    {matchesInRound}/{pairsInRound || 0}
                  </span>
                </div>
              </div>
              <div className={`flex items-center gap-2 text-sm font-semibold ${textTone}`}>
                {isPeeking && (
                  <span className="inline-flex items-center gap-1 opacity-80">
                    <Eye className="w-4 h-4" />
                    Peek
                  </span>
                )}
                <span className="opacity-90">
                  Round {Math.min(roundIndex + 1, totalRounds)} / {totalRounds}
                </span>
              </div>
            </div>

            <div
              className={`flex-1 min-h-0 transition-opacity duration-500 ${
                boardVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div
                className={`grid ${getGridClass(tiles.length)} auto-rows-fr gap-3 sm:gap-4 w-full h-full max-w-6xl mx-auto p-1`}
              >
                {tiles.map((tile) => {
                  const isMatched = matchedPairIds.includes(tile.pairId);
                  const isFlipped =
                    isPeeking || isMatched || flippedKeys.includes(tile.key);
                  return (
                    <MemoryCard
                      key={tile.key}
                      content={tile.content}
                      isFlipped={isFlipped}
                      isMatched={isMatched}
                      isImage={tile.isImage}
                      disabled={isPeeking || isProcessing || isMatched}
                      backClass={secondaryColor?.bgClass || 'bg-purple-500'}
                      shadow={shadow}
                      compact={tiles.length >= 12}
                      onClick={() => handleCardClick(tile)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <SubjectList
          isOpen={isSubjectListModalOpen}
          onClose={() => setIsSubjectListModalOpen(false)}
          user={user}
          page="memory"
        />
      </div>
    </div>
  );
}

function MemoryCard({
  content,
  onClick,
  isFlipped,
  isMatched,
  isImage,
  disabled,
  backClass,
  shadow,
  compact = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isFlipped}
      className={`memory-card relative w-full h-full min-h-0 rounded-2xl cursor-pointer select-none overflow-hidden
        ${disabled && !isFlipped ? 'cursor-default' : ''}
        ${isMatched ? 'memory-card-matched' : ''}`}
      style={{ perspective: '1000px' }}
      aria-pressed={isFlipped}
    >
      <div
        className={`memory-card-inner relative w-full h-full transition-transform duration-500 ease-out
          ${isFlipped ? 'is-flipped' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className={`memory-card-face absolute inset-0 flex items-center justify-center rounded-2xl border-4
            background-shadow-new ${backClass}
            ${shadow ? 'shadow-lg' : ''}`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <img
            src={CardifyLogo}
            alt=""
            className={`${compact ? 'w-8 h-8 sm:w-12 sm:h-12' : 'w-12 h-12 sm:w-16 sm:h-16'} opacity-95 pointer-events-none`}
            draggable={false}
          />
        </div>

        <div
          className={`memory-card-face memory-card-face-back absolute inset-0 flex items-center justify-center rounded-2xl border-4 p-2 sm:p-3
            background-shadow-new bg-white
            ${isMatched ? 'border-green-500' : 'border-[rgba(3,15,64,1)]'}
            ${shadow ? 'shadow-lg' : ''}`}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {isImage ? (
            <img
              src={content}
              alt="Card"
              className="max-w-full max-h-full object-contain pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="w-full max-h-full overflow-auto text-center">
              <SafeMarkdown
                className={`text-gray-900 prose prose-sm max-w-none [&_p]:m-0 [&_p]:font-bold ${
                  compact
                    ? '[&_p]:text-sm sm:[&_p]:text-base'
                    : '[&_p]:text-base sm:[&_p]:text-lg'
                }`}
              >
                {content || ''}
              </SafeMarkdown>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export default Memory;
