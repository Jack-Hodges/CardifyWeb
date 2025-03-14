import React, { useState, useRef } from "react";
import supabase from "../supabaseClient"; 
import { useNavigate } from "react-router-dom"; 
import BackgroundButton from "../components/Elements/BackgroundButton";
import { useUser } from '../UserContext';
import WelcomeImage from '../images/Logos/WelcomeImage.png';
import WelcomeMobile from '../images/Logos/CardifyText.png';

import BackgroundTitle from '../images/TitleBackground.png';

import ThemeVideo from '../videos/title/Themes.webm';
import PracticeVideo from '../videos/title/Quiz.webm';
import OrganiseVideo from '../videos/title/Organise.webm';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Welcome() {
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); 
  const [firstName, setFirstName] = useState(""); 
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const navigate = useNavigate();
  const { user, setUser } = useUser();

  // If user is already logged in, redirect to home
  if (user) {
    navigate('/home');
  }

  // Toggle between login and sign up
  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName(""); 
  };

  // Handle sign-in or sign-up
  const handleAuth = async () => {
    if (isSignUp) {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (!firstName) {
        toast.error("Please enter your first name");
        return;
      }
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered.");
        }
      } else {
        toast.success("Welcome to Cardify! Check your email to verify your account.");
        const { user } = data;
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: user.id, first_name: firstName }]);
        if (profileError) {
          toast.error(`Error creating profile: ${profileError.message}`);
        } else {
          setUser(user);
          navigate('/home');
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(`Error logging in: ${error.message}`);
      } else {
        setUser(data.user);
        navigate('/home');
      }
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      toast.error(`Error sending password reset email: ${error.message}`);
    } else {
      toast.success("Password reset email sent!");
      setResetEmailSent(true);
    }
  };

  // SVG Icons
  const AppleSVG = (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5" viewBox="0 0 256 315">
      <path fill="white" d="M213.803 167.03c.442 47.58 41.74 63.413 42.197 63.615c-.35 1.116-6.599 22.563-21.757 44.716c-13.104 19.153-26.705 38.235-48.13 38.63c-21.05.388-27.82-12.483-51.888-12.483c-24.061 0-31.582 12.088-51.51 12.871c-20.68.783-36.428-20.71-49.64-39.793c-27-39.033-47.633-110.3-19.928-158.406c13.763-23.89 38.36-39.017 65.056-39.405c20.307-.387 39.475 13.662 51.889 13.662c12.406 0 35.699-16.895 60.186-14.414c10.25.427 39.026 4.14 57.503 31.186c-1.49.923-34.335 20.044-33.978 59.822M174.24 50.199c10.98-13.29 18.369-31.79 16.353-50.199c-15.826.636-34.962 10.546-46.314 23.828c-10.173 11.763-19.082 30.589-16.678 48.633c17.64 1.365 35.66-8.964 46.64-22.262" />
    </svg>
  );

  const GoogleSVG = (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5" viewBox="0 0 256 262">
      <path fill="white" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" />
      <path fill="white" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" />
      <path fill="white" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z" />
      <path fill="white" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" />
    </svg>
  );

  const cross = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );  

  // If showLogin is false, display the simple welcome page
  if (!showLogin) {
    return (
      // Changed container styles:
      <div className="relative overflow-y-auto flex flex-col">
        <ToastContainer position="top-center" autoClose={3000} />
  
        <div className="fixed top-4 right-4 z-50">
          <BackgroundButton
            text="Get Started"
            bgColor="bg-green-500 hover:bg-green-400"
            onClick={() => setShowLogin(true)}
          />
        </div>
  
        {/* Welcome Section */}
        <div className="h-[100dvh] flex flex-col items-center justify-center">
          <img src={BackgroundTitle} alt="Assortment of Cardify images on devices" className="absolute w-full h-[100dvh]"/>
          <h1 className="text-4xl sm:text-8xl font-bold text-gray-800 my-4 dark:text-gray-300">
            Cardify
          </h1>
          <h2 className="text-2xl text-gray-600 dark:text-gray-200">
            Your all-in-one study solution
          </h2>
        </div>
  
        {/* Features Section */}
        <div className="h-[100dvh] flex flex-col items-center justify-center">
          <div className="grid grid-rows-3 grid-cols-4 gap-4 w-4/5 h-4/5">
            <div className="background-shadow background-hover rounded-lg p-4 cursor-pointer row-span-2">
              <h2>Create cards</h2>
            </div>
            <div className="background-shadow background-hover rounded-lg p-4 cursor-pointer flex items-center justify-center bg-black">
              <HoverVideo 
                videoSrc={PracticeVideo}
              />
            </div>
            <div className="background-shadow background-hover rounded-lg p-4 cursor-pointer">
              <h2>Memory</h2>
            </div>
            <div className="background-shadow background-hover rounded-lg p-4 cursor-pointer flex items-center justify-center bg-black">
              <h2>Quiz</h2>
            </div>
            <div className="rounded-lg p-4 cursor-pointer col-span-2 flex items-center justify-center">
              <h2 className="text-6xl font-bold">Features</h2>
            </div>
            <div className="background-shadow background-hover rounded-lg p-4 cursor-pointer row-span-2 flex items-center justify-center bg-black">
                <HoverVideo 
                  videoSrc={ThemeVideo}
                />
            </div>
            <div className="background-shadow background-hover rounded-lg p-4 cursor-pointer col-span-2">
              <h2>Import and export</h2>
            </div>
            <div className="background-shadow background-hover rounded-lg p-4 cursor-pointer flex items-center justify-center bg-black">
              <HoverVideo 
                  videoSrc={OrganiseVideo}
                />
            </div>
          </div>
          {/* <h2 className="text-3xl sm:text-5xl font-bold text-gray-800 mb-4">
            Features
          </h2>
          <p className="text-lg text-gray-600 max-w-md text-center px-4">
            Create flashcards, track progress, and collaborate with classmates.
            <br />
            Cardify is built to help you succeed.
          </p> */}
        </div>
      </div>
    );
  }

  // If showLogin is true, show the sign-in/sign-up component
  return (
    <div className="min-h-screen block sm:flex">
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Top bar container */}
      <div className="absolute top-4 w-full flex items-center justify-between px-4 z-50">
        <BackgroundButton
          image={cross}
          bgColor="bg-red-500 hover:bg-red-400"
          onClick={() => setShowLogin(false)}
        />
        <BackgroundButton
          text={isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          bgColor="bg-green-500 hover:bg-green-400"
          onClick={toggleSignUp}
        />
      </div>

      <div className="w-full sm:w-1/2 flex items-center justify-center">
        <img 
          src={WelcomeImage} 
          alt="Illustration" 
          className="hidden sm:block object-contain w-full sm:mt-[-20%]" 
        />
        <img
          src={WelcomeMobile}
          alt="Illustration"
          className="block sm:hidden object-contain w-full mt-24 mb-10"
        />
      </div>

      <div className="w-full sm:w-1/2 flex flex-col justify-center relative">
        <div className="w-[90%] sm:w-4/5 mx-auto sm:p-8">
          <h2 className="text-3xl font-semibold text-gray-800">
            {isSignUp ? "Sign Up" : "Sign In"}
          </h2>

          <div className="flex space-x-4 mt-4">
            <BackgroundButton 
              text="Google"
              image={GoogleSVG}
              flip
              wWidth="w-full"
              bgColor={'bg-red-500 hover:bg-red-400'}
            />
            <BackgroundButton
              text="Apple"
              image={AppleSVG}
              flip
              wWidth="w-full"
              bgColor={'bg-red-500 hover:bg-red-400'}
            />
          </div>

          <div className="mt-8">
            <p className="text-gray-600 dark:text-gray-200">
              {isSignUp ? "Sign up with your email address" : "Sign in with your email address"}
            </p>

            {/* First Name Input */}
            {isSignUp && (
              <div className="mt-4">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 ml-4">
                  First Name
                </label>
                <FancyInput 
                  type="text" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                />
              </div>
            )}

            {/* Email Input */}
            <div className="mt-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 ml-4">
                Email address
              </label>
              <FancyInput 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>

            {/* Password Input */}
            <div className="mt-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 ml-4">
                Password
              </label>
              <FancyInput 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>

            {/* Confirm Password for Sign Up */}
            {isSignUp && (
              <div className="mt-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 ml-4">
                  Confirm Password
                </label>
                <FancyInput
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {/* Forgot Password */}
            {!isSignUp && (
              <div className="mt-4 text-right">
                <button onClick={handlePasswordReset} className="text-blue-500 hover:underline">
                  Forgot Password?
                </button>
              </div>
            )}
            {resetEmailSent && (
              <p className="mt-2 text-green-500">Password reset email sent!</p>
            )}

            {/* Auth Button */}
            <div className="mt-6">
              <BackgroundButton
                text={isSignUp ? "Sign Up" : "Start Learning"}
                onClick={handleAuth}
                bgColor={'bg-blue-500 hover:bg-blue-400'}
                wWidth="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;

function FancyInput({ type, value, onChange }) {
  return (
    <input
      type={type}
      name={type}
      id={type}
      placeholder={`Enter ${type}...`}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 text-left rounded-full bg-gray-500 text-white
                 focus:outline-none background-shadow background-focus"
    />
  );
}

function HoverVideo({ videoSrc, title }) {
  const videoRef = useRef(null);

  const handleMouseEnter = async () => {
    try {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (error) {
      console.error("Error attempting to play:", error);
    }
  };

  const handleMouseLeave = () => {
    try {
      videoRef.current.pause();
    } catch (error) {
      console.error("Error attempting to pause:", error);
    }
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative cursor-pointer rounded-lg overflow-hidden"
    >
      <video
        ref={videoRef}
        src={videoSrc}
        loop
        muted
        playsInline
        preload="auto"
        autoPlay={true}
        className="w-full h-full object-cover"
      />
      {title && (
        <div className="absolute bottom-0 left-0 p-2 bg-black bg-opacity-50 text-white">
          {title}
        </div>
      )}
    </div>
  );
}