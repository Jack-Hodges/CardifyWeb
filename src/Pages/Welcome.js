import React from 'react';

function Welcome() {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
                <h1 className="text-2xl font-bold text-center mb-4">Cardify</h1>
                <p className="text-center text-gray-600 mb-8">Please log in or sign up to continue</p>

                <form className="flex flex-col space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                        Log In
                    </button>

                    <button className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
                        Sign Up
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Welcome;