import React, { useState, useRef, useEffect } from "react";
import supabase from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import BackgroundButton from "../components/Elements/BackgroundButton";
import MultiButton from "../components/Elements/MultiButton";
import { useUser } from '../UserContext';
import { Helmet } from 'react-helmet-async';
import {
  BadgePlus,
  CirclePlay,
  NotebookText,
  Shuffle,
  BookText,
  Palette,
  Sparkles,
  FolderOpen,
} from 'lucide-react';

import CardifyImage from '../images/title/CardifyImage.png';
import CardifyLogo from '../images/Logos/CardifyLogoOfficial.png';

import ThemeVideo from '../videos/Themes.webm';
import PracticeVideo from '../videos/Practice.webm';
import DashboardVideo from '../videos/Dashboard.webm';
import CreateVideo from '../videos/Create.webm';
import HomeVideo from '../videos/Home.webm';
import GenerateVideo from '../videos/Generate.webm';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FEATURES = [
  {
    id: 'home',
    eyebrow: 'Your study HQ',
    title: 'Pick up right where you left off',
    description:
      'Pinned subjects, in-progress decks, and one-tap jump-ins keep studying frictionless — so you spend time learning, not hunting for files.',
    video: HomeVideo,
    accent: 'bg-green-500',
    icon: <CirclePlay size={28} strokeWidth={2.5} />,
  },
  {
    id: 'create',
    eyebrow: 'Make it yours',
    title: 'Build flashcards your brain actually likes',
    description:
      'Mix text, math, images, and drawings on the same card. Import what you already have, or sketch something new — then share subjects with friends.',
    video: CreateVideo,
    accent: 'bg-red-400',
    icon: <BadgePlus size={28} strokeWidth={2.5} />,
  },
  {
    id: 'practice',
    eyebrow: 'Play to remember',
    title: 'Five ways to practice. Zero boredom.',
    description:
      'Flip through Practice, race Memory, crush Quiz, untangle Scramble, or type it out. Same cards, different games — so review never feels like a chore.',
    video: PracticeVideo,
    accent: 'bg-orange-400',
    icon: <NotebookText size={28} strokeWidth={2.5} />,
    modes: [
      { label: 'Practice', color: 'text-red-400', icon: <CirclePlay size={22} /> },
      { label: 'Memory', color: 'text-yellow-500', icon: <BookText size={22} /> },
      { label: 'Quiz', color: 'text-green-500', icon: <NotebookText size={22} /> },
      { label: 'Scramble', color: 'text-blue-500', icon: <Shuffle size={22} /> },
      { label: 'Type', color: 'text-purple-500', icon: <BookText size={22} /> },
    ],
  },
  {
    id: 'organise',
    eyebrow: 'Stay organised',
    title: 'Subjects and collections that scale with you',
    description:
      'Group cards into subjects, nest subjects in collections, then search and sort when your library gets big. Studying stays tidy even when your notes don’t.',
    video: DashboardVideo,
    accent: 'bg-blue-500',
    icon: <FolderOpen size={28} strokeWidth={2.5} />,
  },
  {
    id: 'themes',
    eyebrow: 'Make it feel like you',
    title: 'Themes and art that match your vibe',
    description:
      'Swap backgrounds, subject art, and light or dark mode. Cardify should feel like your study space — not a generic spreadsheet with flashcards taped on.',
    video: ThemeVideo,
    accent: 'bg-fuchsia-500',
    icon: <Palette size={28} strokeWidth={2.5} />,
  },
  {
    id: 'generate',
    eyebrow: 'Stuck? Generate.',
    title: 'AI when you need a head start',
    description:
      'Generate a deck from a topic, or drop in a CSV or spreadsheet. Edit anything after — you’re still in control, just faster getting started.',
    video: GenerateVideo,
    accent: 'bg-purple-500',
    icon: <Sparkles size={28} strokeWidth={2.5} />,
  },
];

function Welcome() {
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const navigate = useNavigate();
  const { user, setUser, startSignUpProcess, theme } = useUser();

  const scrollToFeatures = () => {
    const featuresSection = document.querySelector('.features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (user) {
    navigate('/home');
  }

  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
  };

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

      startSignUpProcess();

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
            theme: 'default'
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

  const handlePasswordReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      toast.error(`Error sending password reset email: ${error.message}`);
    } else {
      toast.success("Password reset email sent!");
      setResetEmailSent(true);
    }
  };

  const cross = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );

  if (!showLogin) {
    return (
      <div className="w-screen relative overflow-x-hidden">
        <Helmet>
          <title>Cardify - Smart Flashcard Study App | Create & Practice Custom Flashcards</title>
          <meta name="description" content="Create and customize flashcards with text, mathematical equations, images, and drawings. Practice with quizzes, memory games, and AI-powered generation. Study smarter with Cardify." />
          <meta name="keywords" content="flashcards, study app, learning, education, quiz, memory games, AI flashcards, math equations, custom study materials, practice tests" />
          <link rel="canonical" href="https://cardify.app" />
          <meta property="og:title" content="Cardify - Smart Flashcard Study App" />
          <meta property="og:description" content="Create and customize flashcards with text, math, images, and drawings. Practice with quizzes, memory games, and AI-powered generation." />
          <meta property="og:image" content="https://cardify.app/logo512.png" />
          <meta property="og:url" content="https://cardify.app" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Cardify - Smart Flashcard Study App" />
          <meta name="twitter:description" content="Create and customize flashcards with text, math, images, and drawings. Practice with quizzes, memory games, and AI-powered generation." />
          <meta name="twitter:image" content="https://cardify.app/logo512.png" />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Cardify - Smart Flashcard Study App",
              "description": "Create and customize flashcards with text, mathematical equations, images, and drawings. Practice with quizzes, memory games, and AI-powered generation.",
              "url": "https://cardify.app",
              "mainEntity": {
                "@type": "SoftwareApplication",
                "name": "Cardify",
                "applicationCategory": "EducationalApplication",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                }
              }
            })}
          </script>
        </Helmet>

        <div
          className="fixed inset-0 w-screen h-screen bg-cover bg-center bg-no-repeat z-0"
          style={{
            background: theme.image.startsWith('url(') || theme.image.startsWith('linear-gradient') || theme.image.startsWith('#')
              ? theme.image
              : `url(${theme.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        <div className="relative z-10 min-h-screen flex flex-col bg-[#f1ebe0] dark:bg-gray-800">
          <ToastContainer position="top-center" autoClose={3000} />

          <div className="fixed top-4 right-4 z-50">
            <MultiButton
              buttons={[
                {
                  text: "Features",
                  onClick: scrollToFeatures
                },
                {
                  text: "Sign Up",
                  onClick: () => {
                    setShowLogin(true);
                    setIsSignUp(true);
                  }
                },
                {
                  text: "Login",
                  onClick: () => setShowLogin(true)
                },
              ]}
            />
          </div>

          {/* Hero — one composition: brand, headline, support, CTA, product image */}
          <section className="relative min-h-screen flex flex-col sm:flex-row overflow-hidden">
            <div
              className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-green-400/25 blur-3xl animate-welcome-blob"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-10 right-0 w-80 h-80 rounded-full bg-orange-300/20 blur-3xl animate-welcome-blob-delayed"
              aria-hidden
            />

            <div className="relative w-full sm:w-[48%] flex flex-col justify-center px-6 sm:pl-10 sm:pr-4 pt-28 sm:pt-0 pb-8 sm:pb-0 z-10">
              <div className="flex items-center gap-2 mb-6 sm:mb-8 animate-welcome-rise">
                <img src={CardifyLogo} alt="" className="w-12 h-12 sm:hidden" />
                <h1 className="text-5xl sm:text-7xl font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none">
                  Cardify
                  <span className="ml-2 align-middle text-lg sm:text-2xl font-semibold text-gray-500 dark:text-gray-400">
                    beta
                  </span>
                </h1>
              </div>

              <h2 className="text-3xl sm:text-5xl font-bold text-gray-800 dark:text-gray-100 leading-tight animate-welcome-rise-delayed">
                Flashcards that feel like a game.
              </h2>
              <p className="mt-4 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-md animate-welcome-rise-delayed-2">
                Create, customise, and practice your own decks — with modes that make studying stick.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-welcome-rise-delayed-2">
                <BackgroundButton
                  text="Get Started"
                  onClick={() => setShowLogin(true)}
                  bgColor="bg-purple-500 hover:bg-purple-400"
                  wWidth="w-full sm:w-auto"
                />
                <BackgroundButton
                  text="See what’s inside"
                  onClick={scrollToFeatures}
                  bgColor="bg-green-500 hover:bg-green-400"
                  wWidth="w-full sm:w-auto"
                />
              </div>
            </div>

            <div className="relative w-full sm:w-[52%] flex items-end sm:items-center justify-center sm:justify-end pb-6 sm:pb-0 animate-welcome-float">
              <img
                src={CardifyImage}
                alt="Students using Cardify to study with custom flashcards"
                className="w-[85%] sm:w-[95%] max-h-[55vh] sm:max-h-[90vh] object-contain drop-shadow-lg"
              />
            </div>
          </section>

          {/* Features — scroll story, no carousel */}
          <section className="features-section relative py-16 sm:py-24 px-5 sm:px-10">
            <div className="max-w-6xl mx-auto mb-14 sm:mb-20 text-center sm:text-left">
              <p className="text-sm font-bold uppercase tracking-widest text-green-600 dark:text-green-400 mb-3">
                What’s inside
              </p>
              <h2 className="text-4xl sm:text-6xl font-bold text-gray-800 dark:text-gray-100">
                Everything you need to study smarter
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Scroll through — every feature is built to keep learning playful and organised.
              </p>
            </div>

            <div className="max-w-6xl mx-auto flex flex-col gap-20 sm:gap-28">
              {FEATURES.map((feature, index) => (
                <FeatureBand
                  key={feature.id}
                  feature={feature}
                  reverse={index % 2 === 1}
                />
              ))}
            </div>
          </section>

          {/* Closing CTA */}
          <section className="relative px-5 sm:px-10 pb-24 pt-8">
            <div className="max-w-4xl mx-auto text-center bg-white dark:bg-gray-700 background-shadow-new rounded-3xl px-6 py-14 sm:py-16">
              <h2 className="text-3xl sm:text-5xl font-bold text-gray-800 dark:text-gray-100">
                Ready to make studying fun?
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                Free to start. Build your first subject in minutes — then practice however you like.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
                <BackgroundButton
                  text="Create a free account"
                  onClick={() => {
                    setShowLogin(true);
                    setIsSignUp(true);
                  }}
                  bgColor="bg-purple-500 hover:bg-purple-400"
                  wWidth="w-full sm:w-auto"
                />
                <BackgroundButton
                  text="I already have an account"
                  onClick={() => {
                    setShowLogin(true);
                    setIsSignUp(false);
                  }}
                  bgColor="bg-green-500 hover:bg-green-400"
                  wWidth="w-full sm:w-auto"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen relative overflow-x-hidden">
      <Helmet>
        <title>{isSignUp ? 'Sign Up - Cardify | Join Smart Flashcard Study App' : 'Sign In - Cardify | Access Your Flashcards'}</title>
        <meta name="description" content={isSignUp ? 'Create your free Cardify account to start making custom flashcards with AI-powered generation, practice modes, and progress tracking.' : 'Sign in to your Cardify account to access your custom flashcards, practice sessions, and study progress.'} />
        <meta property="og:title" content={isSignUp ? 'Sign Up - Cardify' : 'Sign In - Cardify'} />
        <meta property="og:description" content={isSignUp ? 'Create your free account to start making custom flashcards' : 'Sign in to access your flashcards and study progress'} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="fixed inset-0 z-0 bg-[#f1ebe0] dark:bg-gray-800" />
      <div
        className="pointer-events-none fixed -top-20 -left-16 w-72 h-72 rounded-full bg-green-400/20 blur-3xl z-0"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-10 -right-10 w-80 h-80 rounded-full bg-purple-300/20 blur-3xl z-0"
        aria-hidden
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        <ToastContainer position="top-center" autoClose={3000} />

        <div className="flex items-center justify-between px-4 sm:px-6 pt-4">
          <BackgroundButton
            image={cross}
            bgColor="bg-red-500 hover:bg-red-400"
            onClick={() => setShowLogin(false)}
          />
          <div className="flex items-center gap-2">
            <img src={CardifyLogo} alt="" className="w-9 h-9" />
            <span className="text-xl font-bold text-gray-800 dark:text-gray-100 hidden sm:inline">
              Cardify
            </span>
          </div>
          <div className="w-10" aria-hidden />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
          <div className="w-full max-w-md">
            <div className="bg-white dark:bg-gray-700 background-shadow-new rounded-3xl p-6 sm:p-8">
              <div className="text-center mb-6">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">
                  {isSignUp ? 'Create your account' : 'Welcome back'}
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  {isSignUp
                    ? 'Start building decks and practicing in minutes.'
                    : 'Sign in to pick up where you left off.'}
                </p>
              </div>

              {/* Mode toggle */}
              <div className="flex p-1 mb-6 rounded-full bg-gray-100 dark:bg-gray-600 border-2 border-[var(--theme-border-color)]">
                <button
                  type="button"
                  onClick={() => {
                    if (isSignUp) toggleSignUp();
                  }}
                  className={`flex-1 py-2 rounded-full text-sm font-bold transition-colors ${
                    !isSignUp
                      ? 'bg-green-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isSignUp) toggleSignUp();
                  }}
                  className={`flex-1 py-2 rounded-full text-sm font-bold transition-colors ${
                    isSignUp
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAuth();
                }}
              >
                {isSignUp && (
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 ml-3 mb-1">
                      First name
                    </label>
                    <FancyInput
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Your first name"
                      autoComplete="given-name"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 ml-3 mb-1">
                    Email
                  </label>
                  <FancyInput
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between ml-3 mb-1">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Password
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={handlePasswordReset}
                        className="text-sm font-semibold text-blue-500 hover:text-blue-400"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <FancyInput
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  />
                </div>

                {isSignUp && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 ml-3 mb-1">
                      Confirm password
                    </label>
                    <FancyInput
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                )}

                {resetEmailSent && (
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400 ml-3">
                    Password reset email sent — check your inbox.
                  </p>
                )}

                <div className="pt-2">
                  <BackgroundButton
                    text={isSignUp ? 'Create account' : 'Start learning'}
                    onClick={handleAuth}
                    bgColor={isSignUp ? 'bg-purple-500 hover:bg-purple-400' : 'bg-green-500 hover:bg-green-400'}
                    wWidth="w-full"
                  />
                </div>
              </form>
            </div>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {isSignUp ? 'Already studying with us?' : 'New here?'}{' '}
              <button
                type="button"
                onClick={toggleSignUp}
                className="font-bold text-gray-800 dark:text-gray-100 underline underline-offset-2"
              >
                {isSignUp ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;

function FancyInput({ id, type, value, onChange, placeholder, autoComplete }) {
  return (
    <input
      id={id}
      type={type}
      name={id || type}
      placeholder={placeholder || `Enter ${type}...`}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      className="w-full px-4 py-3 text-left rounded-full bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-white
                 placeholder:text-gray-400 dark:placeholder:text-gray-300
                 focus:outline-none background-shadow-new background-focus font-medium"
    />
  );
}

function FeatureBand({ feature, reverse }) {
  return (
    <article
      className={`flex flex-col ${reverse ? 'sm:flex-row-reverse' : 'sm:flex-row'} items-center gap-8 sm:gap-12`}
    >
      <div className="w-full sm:w-1/2">
        <div className="relative rounded-2xl overflow-hidden background-shadow-new bg-white dark:bg-gray-700">
          <ScrollVideo videoSrc={feature.video} />
        </div>
      </div>

      <div className="w-full sm:w-1/2">
        <div className={`inline-flex items-center gap-2 text-white px-3 py-1.5 rounded-full mb-4 ${feature.accent} background-shadow-new`}>
          {feature.icon}
          <span className="text-sm font-bold uppercase tracking-wide">{feature.eyebrow}</span>
        </div>
        <h3 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 leading-tight">
          {feature.title}
        </h3>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
          {feature.description}
        </p>

        {feature.modes && (
          <div className="mt-6 flex flex-wrap gap-2">
            {feature.modes.map((mode) => (
              <div
                key={mode.label}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-gray-700 background-shadow-new font-bold text-sm ${mode.color}`}
              >
                {mode.icon}
                {mode.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function ScrollVideo({ videoSrc }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [videoSrc]);

  return (
    <div ref={containerRef} className="relative aspect-[4/3] sm:aspect-video bg-gray-200 dark:bg-gray-600">
      <video
        ref={videoRef}
        src={videoSrc}
        loop
        muted
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
