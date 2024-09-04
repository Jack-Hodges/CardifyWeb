function MenuBar() {
    return (
        <div class="w-1/2 h-[5vh] flex justify-between mx-5 items-center">
            <TitleBarLarge text="Cardify" />
            <TitleBar text="Home" />
            <TitleBar text="Your Flashcards" />
        </div>
    );
}

export default MenuBar;

function TitleBar( { text }) {
    return (
        <p class="font-bold text-xl bg-gradient-to-br from-blue-500 to-green-300 bg-clip-text text-transparent">{text}</p>
    );
}

function TitleBarLarge( { text } ) {
    return (
        <p class="font-bold text-3xl bg-gradient-to-br from-blue-500 to-green-300 bg-clip-text text-transparent">{text}</p>
    );
}