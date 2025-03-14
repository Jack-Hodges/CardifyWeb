import CardifyLogo from '../../images/Logos/CardifyLogoNoText.png';

function MenuBar() {
    return (
        <div className="w-full h-[10vh] sm:h-[6vh] flex items-center justify-between px-3">
            <img src={CardifyLogo} className="w-10" alt="Logo"/>
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                <p className="text-white font-bold text-xl">J</p>
            </div>
        </div>
    );
}

export default MenuBar;