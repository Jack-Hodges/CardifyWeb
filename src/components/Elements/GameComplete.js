import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useUser } from '../../UserContext';
import BackgroundButton from './BackgroundButton';
import { PAGE_EMPTY_STATE_CLASS } from './PageEmptyState';

export default function GameComplete({
    emoji = '🎉',
    title,
    children,
    celebrate = true,
    primaryText = 'Back to Home',
    onPrimary,
    secondaryText,
    onSecondary,
}) {
    const { theme } = useUser();
    const { textClass, secondaryColor, tertiaryColor, shadow } = theme;

    useEffect(() => {
        if (celebrate) {
            confetti({
                particleCount: 300,
                spread: 100,
                origin: { y: 0.5 },
                gravity: 0.9,
            });
        }
    }, [celebrate]);

    return (
        <div className={`${PAGE_EMPTY_STATE_CLASS} text-center`}>
            {emoji && <div className="text-8xl sm:text-9xl mb-8">{emoji}</div>}

            {title && (
                <p className={`font-bold text-2xl sm:text-3xl mb-4 ${theme ? textClass : 'textColor'} ${shadow ? 'drop-shadow-custom' : ''}`}>
                    {title}
                </p>
            )}

            {children && <div className="mb-8">{children}</div>}

            <div className="flex flex-col sm:flex-row gap-4">
                <BackgroundButton
                    text={primaryText}
                    bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : 'bg-orange-500 hover:bg-orange-400'}
                    onClick={onPrimary}
                />
                {secondaryText && (
                    <BackgroundButton
                        text={secondaryText}
                        bgColor={theme ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}` : 'bg-purple-500 hover:bg-purple-400'}
                        onClick={onSecondary}
                    />
                )}
            </div>
        </div>
    );
}
