import Flip from '../images/icons/flip.png';

function Card({ frontContent, backContent, flipped, setFlipped, animateFlip }) {

    return (
        <div
            className="relative h-full w-full"
            onClick={() => setFlipped(!flipped)}
            style={{ perspective: '1000px' }}
        >
            <div
                className={`absolute inset-0 transform ${animateFlip ? 'transition-transform duration-700 ease-in-out' : ''} ${flipped ? 'rotate-y-180' : ''}`}
                style={{
                    transformStyle: 'preserve-3d',
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
            >
                {/* Front card */}
                <div
                    className="absolute inset-0 flex items-center justify-center bg-gray-50 p-5 shadow-xl rounded-2xl select-none"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(0deg)',
                    }}
                >
                    <p className="text-4xl">{frontContent}</p>
                    <img src={Flip} alt="Flip" className="w-10 m-2 absolute bottom-0 right-0" />
                </div>

                {/* Back card */}
                <div
                    className="absolute inset-0 flex items-center justify-center bg-gray-50 p-5 shadow-xl rounded-2xl select-none"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                    }}
                >
                    <p className="text-4xl">{backContent}</p>
                    <img src={Flip} alt="Flip" className="w-10 m-2 absolute bottom-0 right-0" />
                </div>
            </div>
        </div>
    );
}

export default Card;