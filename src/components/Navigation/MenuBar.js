import CardifyLogo from '../../images/Logos/CardifyLogoNoText.png';

function MenuBar() {
    return (
        <div className="w-full h-[6vh] flex items-center justify-between px-3">
            <img src={CardifyLogo} class="w-10"/>
            <div class="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                <p class="text-white font-bold text-xl">J</p>
            </div>
        </div>
    );
}

export default MenuBar;