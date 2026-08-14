import BackgroundButton from '../Elements/BackgroundButton';
import PageEmptyState from '../Elements/PageEmptyState';
import { useUser } from '../../UserContext';

/**
 * End-of-session summary used by Practice (SM-2) and Quiz.
 * Renders on the page with theme styling — not a glass modal.
 */
function SessionSummary({
  title = 'Session complete',
  correct = 0,
  incorrect = 0,
  cardsSeen = 0,
  durationSec = 0,
  onStudyAgain,
  onRetryWeak,
  onHome,
  weakCount = 0,
}) {
  const { theme } = useUser();
  const { textClass, secondaryColor, tertiaryColor, shadow } = theme || {};
  const totalGraded = correct + incorrect;
  const accuracy = totalGraded ? Math.round((correct / totalGraded) * 100) : 0;
  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;
  const textTone = theme ? textClass : 'textColor';
  const shadowClass = shadow ? 'drop-shadow-custom' : '';

  return (
    <PageEmptyState>
      <div className="text-center max-w-lg mx-auto">
        <p className={`font-bold text-2xl sm:text-3xl mb-2 ${textTone} ${shadowClass}`}>
          {title}
        </p>
        <p className={`text-lg sm:text-xl font-medium mb-8 opacity-90 ${textTone} ${shadowClass}`}>
          {cardsSeen} cards · {mins}m {secs}s · {accuracy}% accuracy
        </p>

        <div className={`grid grid-cols-3 gap-4 mb-10 ${textTone} ${shadowClass}`}>
          <Stat label="Correct" value={correct} />
          <Stat label="Missed" value={incorrect} />
          <Stat label="Weak" value={weakCount} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {onStudyAgain && (
            <BackgroundButton
              text="Study again"
              bgColor={
                theme
                  ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}`
                  : 'bg-blue-500 hover:bg-blue-400'
              }
              onClick={onStudyAgain}
              wWidth="w-full sm:w-auto"
            />
          )}
          {onRetryWeak && weakCount > 0 && (
            <BackgroundButton
              text="Retry weak cards"
              bgColor="bg-orange-500 hover:bg-orange-400"
              onClick={onRetryWeak}
              wWidth="w-full sm:w-auto"
            />
          )}
          {onHome && (
            <BackgroundButton
              text="Back to Home"
              bgColor={
                theme
                  ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}`
                  : 'bg-gray-600 hover:bg-gray-500'
              }
              onClick={onHome}
              wWidth="w-full sm:w-auto"
            />
          )}
        </div>
      </div>
    </PageEmptyState>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-3xl sm:text-4xl font-bold">{value}</p>
      <p className="text-sm sm:text-base font-medium opacity-80 mt-1">{label}</p>
    </div>
  );
}

export default SessionSummary;
