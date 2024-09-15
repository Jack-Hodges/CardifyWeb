// App.js
import React from "react";
import BackgroundButton from "../components/Elements/BackgroundButton";

import GoogleLogo from '../images/Logos/GoogleLogo.png';
import AppleLogo from '../images/Logos/AppleLogo.png';

function Welcome() {
  return (
    <div className="min-h-screen flex">
      {/* Left Section with Image */}
      <div className="w-1/2 bg-gray-100 flex items-center justify-center">
        <img
          src="/path-to-your-image.png"
          alt="Illustration"
          className="object-contain w-3/4"
        />
      </div>

      {/* Right Section */}
      <div className="w-1/2 flex flex-col justify-center relative">
        {/* Sign up link at top right */}
        <div className="absolute top-4 right-4">
          <a href="/signup" className="text-white background-shadow rounded-full p-2 bg-green-500 hover:bg-green-400 background-hover">
            Don't have an account? <span className="font-semibold">Sign up</span>
          </a>
        </div>

        {/* Login Form in the middle */}
        <div className="w-4/5 mx-auto p-8">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-300">Sign in</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Sign in with</p>
          <div className="flex space-x-4 mt-4">
            <button className={`relative inline-flex items-center justify-center w-1/2 h-10 bg-gray-500 hover:bg-gray-400 text-white text-lg font-semibold rounded-full background-shadow background-hover`}>
              <div className="flex items-center p-2">
                <img class="w-10" src={GoogleLogo} alt="Google Sign In"/>
                <span className="ml-2">Google</span>
              </div>
            </button>
            <button className={`relative inline-flex items-center justify-center w-1/2 h-10 bg-gray-500 hover:bg-gray-400 text-white text-lg font-semibold rounded-full background-shadow background-hover`}>
              <div className="flex items-center p-2">
                <img class="w-8" src={AppleLogo} alt="Apple Sign In"/>
                <span className="ml-2">Apple</span>
              </div>
            </button>
          </div>
          <div className="mt-8">
            <p className="text-gray-600 dark:text-gray-400">Or continue with email address</p>
            <div className="mt-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-500 ml-4">
                Email address
              </label>
              <FancyInput type="email"/>
            </div>

            
            <div className="mt-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-500 ml-4">
                Password
              </label>
              <FancyInput type="password" />
            </div>
            <div className="mt-6">
              <BackgroundButton text="Start Learning" bgColor={"blue"}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;

function FancyInput( { type }) {
  return (
    <input
      type={type}
      name={type}
      id={type}
      placeholder={`Enter ${type}...`}
      className="w-full px-4 py-2 text-left rounded-full bg-gray-600 text-white background-shadow background-focus focus:outline-none"
    />
  );
}
