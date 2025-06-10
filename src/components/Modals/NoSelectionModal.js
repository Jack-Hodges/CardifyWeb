import { useUser } from "../../UserContext";
import BackgroundButton from "../Elements/BackgroundButton";

export default function NoSelectionModal( { text, text1, text2, action1, action2 } ) {
    const { theme } = useUser();
    const { secondaryColor, tertiaryColor, shadow } = theme;
    
  return (
    <div>
        <p 
            className={`${theme ? theme.textClass : 'textColor'} text-4xl font-bold text-center ${shadow ? 'drop-shadow-custom' : ''}`}
        >
            {text}
        </p>
        <div className="block sm:flex gap-4 mt-5 mx-4 sm:mx-0 items-center justify-center">
            <BackgroundButton
                text={text1}
                bgColor={
                    theme 
                    ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` 
                    : "bg-orange-500 hover:bg-orange-400"
                }
                onClick={action1}
                wWidth="w-full sm:w-auto mb-3 sm:mb-0"
            />

            {text2 && (
                <BackgroundButton
                    text={text2}
                    bgColor={
                        theme 
                        ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}` 
                        : "bg-purple-500 hover:bg-purple-400"
                    }
                    onClick={action2}
                    wWidth="w-full sm:w-auto"
                />
            )}
        </div>
    </div>
  );
}