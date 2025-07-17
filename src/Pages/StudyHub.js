import { useUser } from '../UserContext';
import TitleBar from '../components/Navigation/TitleBar';

export default function StudyHub() {
    const { user, theme } = useUser();
    const { secondaryColor, shadow, primaryColor, textClass } = theme;  // Get the secondary color

    return (
        <div className="w-screen h-screen relative">
            {/* Fixed background - ensure it covers entire viewport */}
            <div 
                className="fixed inset-0 w-screen h-screen bg-cover bg-center bg-no-repeat z-0"
                style={{ 
                background: theme.image.startsWith('url(') || theme.image.startsWith('linear-gradient') || theme.image.startsWith('#') 
                    ? theme.image 
                    : `url(${theme.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
                }}
            ></div>
            
            {/* Scrolling content */}
            <div className="relative z-10 min-h-screen pb-20">
                {/* Header Section */}
                <TitleBar text="StudyHub" user={user}/>
            </div>

            {/* Content div */}
            <div className="w-full h-full flex flex-col items-center justify-center">
                <p className={`text-4xl sm:text-5xl font-bold ${shadow ? 'drop-shadow-custom' : ''}`}>StudyHub</p>
            </div>
        </div>
    );
}