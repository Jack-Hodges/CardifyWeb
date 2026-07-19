import BackgroundButton from '../Elements/BackgroundButton';

/**
 * End-of-session summary used by Practice and Quiz.
 */
function SessionSummary({
  title = 'Session complete',
  correct = 0,
  incorrect = 0,
  cardsSeen = 0,
  durationSec = 0,
  onStudyAgain,
  onHome,
  weakCount = 0,
}) {
  const totalGraded = correct + incorrect;
  const accuracy = totalGraded ? Math.round((correct / totalGraded) * 100) : 0;
  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8">
      <div
        className="rounded-2xl border border-white/20 bg-gradient-to-t from-black/50 via-black/35 to-black/25
          backdrop-blur-xl shadow-2xl shadow-black/30 p-6 sm:p-8 text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{title}</h2>
        <p className="text-white/70 mb-6">
          {cardsSeen} cards · {mins}m {secs}s · {accuracy}% accuracy
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stat label="Correct" value={correct} tone="text-green-300" />
          <Stat label="Missed" value={incorrect} tone="text-red-300" />
          <Stat label="Weak" value={weakCount} tone="text-amber-300" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onStudyAgain && (
            <BackgroundButton
              text="Study again"
              bgColor="bg-blue-500 hover:bg-blue-400"
              onClick={onStudyAgain}
              wWidth="w-full sm:w-auto"
            />
          )}
          {onHome && (
            <BackgroundButton
              text="Back to Home"
              bgColor="bg-gray-600 hover:bg-gray-500"
              onClick={onHome}
              wWidth="w-full sm:w-auto"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-3">
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      <p className="text-xs text-white/60 font-medium">{label}</p>
    </div>
  );
}

export default SessionSummary;
