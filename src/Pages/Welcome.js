import React, { useState, useRef, useEffect } from "react";
import supabase from "../supabaseClient"; 
import { useNavigate } from "react-router-dom"; 
import BackgroundButton from "../components/Elements/BackgroundButton";
import { useUser } from '../UserContext';
import WelcomeImage from '../images/Logos/WelcomeImage.png';
import WelcomeMobile from '../images/Logos/CardifyText.png';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Images
import TopLeftMac from '../images/title/TopLeftMac.png';
import TopRightMac from '../images/title/TopRightMac.png';
import BottomLeftMac from '../images/title/BottomLeftMac.png';

// Videos
import ThemeVideo from '../videos/Themes.webm';
import PracticeVideo from '../videos/Practice.webm';
import DashboardVideo from '../videos/Dashboard.webm';
import CreateVideo from '../videos/Create.webm';
import HomeVideo from '../videos/Home.webm';
import GenerateVideo from '../videos/Generate.webm';

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

  const [currentFeature, setCurrentFeature] = useState(0);
  const features = [
    {
      title: "Layout",
      bullets: [
        "Fun and easy to use interface",
        "Quickly resume your practice from where you left off with In Progress and Pinned subjects",
        "Jump in to a variety of practice modes, including quizzes, memory and more"
      ],
      video: HomeVideo
    },
    {
      title: "Create",
      bullets: [
        "Easily design flashcards with text, mathematical equations, images, and drawings",
        "Upload your own existing flashcards, or generate flashcards with AI, and export as PDF",
        "Share your subjects with your friends to collaborate"
      ],
      video: CreateVideo
    },
    {
      title: "Practice",
      bullets: [
        "Practice your flashcards with Practice, Memory, Quiz, Scramble and Type",
        "Race against yourself to improve your scores",
        "Use the game modes to test your knowledge"
      ],
      video: PracticeVideo
    },
    {
      title: "Organize",
      bullets: [
        "Use Subjects to organise your flashcards",
        "Collections are used to group subjects together",
        "Quick search and filter to find your subjects"
      ],
      video: DashboardVideo
    },
    {
      title: "Themes",
      bullets: [
        "Express yourself with a variety of themes and subject art",
        "Light and Dark modes easily adapt to your preferences",
        "More customisation coming soon"
      ],
      video: ThemeVideo
    },
    {
      title: "Generate",
      bullets: [
        "Easily generate flashcards when you are stuck",
        "Use in built generation, or import your own generated flashcards from a CSV, Excel, or other file",
        "More AI capabilities coming soon"
      ],
      video: GenerateVideo
    },
  ];

  const nextFeature = () => {
    setCurrentFeature((prev) => (prev + 1) % features.length);
  };

  const prevFeature = () => {
    setCurrentFeature((prev) => (prev - 1 + features.length) % features.length);
  };

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
        } else {
          toast.error(`Error signing up: ${error.message}`);
        }
      } else {
        toast.success("Welcome to Cardify! Check your email to verify your account.");
        const { user } = data;
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ 
            id: user.id, 
            first_name: firstName,
            theme: 'default'  // Explicitly set default theme
          }]);
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
          <img src={TopLeftMac} alt="Mac with Cardify open" className="absolute top-5 left-5 w-96"/>
          <img src={TopRightMac} alt="Mac with Cardify open" className="absolute top-5 right-5 w-96 hidden md:block"/>
          <img src={BottomLeftMac} alt="Mac with Cardify open" className="absolute top-[30%] left-1/4 w-96"/>
          <h1 className="text-4xl sm:text-8xl font-bold text-gray-800 my-4 dark:text-gray-300">
            Cardify
          </h1>
          <h2 className="text-2xl text-gray-600 dark:text-gray-200">
            Your all-in-one study solution
          </h2>
        </div>
  
        {/* Features Section */}
        <div className="min-h-screen flex flex-col items-center py-20">
          <h2 className="text-4xl sm:text-6xl font-bold text-gray-800 mb-16">Features</h2>
          
          <div className="relative w-[80vw] h-[60vh]">
            {/* Feature Content */}
            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Features video */}
              <div className="w-full sm:w-1/2 h-full rounded-lg overflow-hidden">
                <HoverVideo videoSrc={features[currentFeature].video} />
              </div>

              {/* Mobile arrows */}
              <div className="sm:hidden flex items-center gap-2 mt-[-5%] mb-[-5%]">
                <BackgroundButton
                  onClick={prevFeature}
                  image={<ChevronLeft/>}
                  bgColor="bg-green-500 hover:bg-green-400"
                />
                <BackgroundButton
                  onClick={nextFeature}
                  image={<ChevronRight/>}
                  bgColor="bg-green-500 hover:bg-green-400"
                />
              </div>

              <div className="flex sm:hidden gap-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeature(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentFeature ? 'bg-gray-800' : 'bg-gray-400'
                  }`}
                />
              ))}
            </div>
              
              {/* Features text */}
              <div className="w-full sm:w-1/2 mb-10 sm:mb-0">
                <h3 className="text-4xl sm:text-5xl font-bold text-gray-800">{features[currentFeature].title}</h3>
                <ul className="text-gray-600 text-lg space-y-2 mt-4">
                  {features[currentFeature].bullets.map((bullet, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Navigation Arrows */}
            <div className="hidden sm:block">
              <div className="absolute left-[-50px] top-1/2 -translate-y-1/2">
                <BackgroundButton
                  onClick={prevFeature}
                  image={<ChevronLeft/>}
                  bgColor="bg-green-500 hover:bg-green-400"
                />
              </div>

              <div className="absolute right-[-50px] top-1/2 -translate-y-1/2">
                <BackgroundButton
                  onClick={nextFeature}
                  image={<ChevronRight/>}
                  bgColor="bg-green-500 hover:bg-green-400"
                />
              </div>
            </div>
            
            {/* Dots Navigation */}
            <div className="hidden sm:flex absolute bottom-20 left-1/2 -translate-x-1/2 gap-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeature(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentFeature ? 'bg-gray-800' : 'bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
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

          {/* <div className="flex space-x-4 mt-4">
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
          </div> */}

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
                 focus:outline-none background-shadow-new background-focus"
    />
  );
}

function HoverVideo({ videoSrc }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Reset the video to the beginning
      video.currentTime = 0;
      // Play the video
      video.play().catch(error => {
        console.error("Error attempting to play:", error);
      });
    }
  }, [videoSrc]); // Add videoSrc as a dependency

  return (
    <div className="relative rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={videoSrc}
        loop
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover"
      />
    </div>
  );
}