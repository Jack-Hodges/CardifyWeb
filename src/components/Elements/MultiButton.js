export default function MultiButton({ buttons }) {
    
    const buttonClassNew = `px-2 relative inline-flex items-center justify-center w-auto h-8 hover:bg-green-400 text-white text-lg font-semibold rounded-full`;
    
    return (
        <div className={`flex flex-row gap-2 bg-green-500 background-shadow-new rounded-full`}>
            {buttons.map((button, index) => (
                <button key={index} className={buttonClassNew} onClick={button.onClick}>
                    {button.text}
                </button>
            ))}
        </div>
    );
}