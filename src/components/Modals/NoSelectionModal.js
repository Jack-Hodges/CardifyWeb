import { useUser } from "../../UserContext";
import BackgroundButton from "../Elements/BackgroundButton";
import { Layers } from "lucide-react";

export default function NoSelectionModal({ text, subtext, text1, text2, action1, action2, icon }) {
    const { theme } = useUser();
    const { secondaryColor, tertiaryColor, shadow } = theme;

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 max-w-2xl mx-auto">
        <div
            className={`flex items-center justify-center w-24 h-24 rounded-full text-white mb-6 background-shadow-new ${secondaryColor.bgClass}`}
        >
            {icon || <Layers size={44} strokeWidth={2.5} />}
        </div>

        <p
            className={`${theme ? theme.textClass : 'textColor'} text-3xl sm:text-4xl font-bold ${shadow ? 'drop-shadow-custom' : ''}`}
        >
            {text}
        </p>

        {subtext && (
            <p
                className={`${theme ? theme.textClass : 'textColor'} text-lg sm:text-xl font-medium mt-3 opacity-90 ${shadow ? 'drop-shadow-custom' : ''}`}
            >
                {subtext}
            </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-7 w-full sm:w-auto items-center justify-center">
            <BackgroundButton
                text={text1}
                bgColor={
                    theme
                    ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}`
                    : "bg-orange-500 hover:bg-orange-400"
                }
                onClick={action1}
                wWidth="w-full sm:w-auto"
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
