import { Pencil, RefreshCw } from 'lucide-react';

function IconButtons({ onEditClick }) {
    return (
        <div className="flex absolute bottom-0 right-0 m-2">
            <div className="rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 bg-transparent p-1 mr-1 transition duration-300">
                <Pencil size="32" onClick={(e) => {
                        e.stopPropagation();
                        onEditClick();
                    }}/>
            </div>

            <div className="rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 bg-transparent p-1 transition duration-300">
                <RefreshCw size="32"/>
            </div>
        </div>
    );
}

export default IconButtons;