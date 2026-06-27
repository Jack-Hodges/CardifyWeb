import { useUser } from '../../UserContext';
import { PAGE_EMPTY_STATE_CLASS } from './PageEmptyState';

export default function LoadingSpinner({ text = 'Loading...' }) {
    const { theme } = useUser();
    const { textClass, shadow } = theme;

    return (
        <div className={`${PAGE_EMPTY_STATE_CLASS} gap-4 ${theme ? textClass : 'textColor'}`}>
            <div className="w-12 h-12 rounded-full border-4 border-current border-t-transparent animate-spin opacity-90" />
            {text && (
                <p className={`text-lg font-semibold ${shadow ? 'drop-shadow-custom' : ''}`}>{text}</p>
            )}
        </div>
    );
}
