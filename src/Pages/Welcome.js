import React, { useState } from "react";
import supabase from "../supabaseClient"; // Import the Supabase client
import { useNavigate } from "react-router-dom"; // For redirection after login
import BackgroundButton from "../components/Elements/BackgroundButton";
import { useUser } from '../UserContext'; // Import the useUser hook
import WelcomeImage from '../images/Logos/WelcomeImage.png';

function Welcome() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false); // State to track if reset email was sent
  const navigate = useNavigate();
  const { user, setUser, logout } = useUser(); // Access user and logout from context

  // Handle sign-in with email and password
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("Error logging in:", error.message);
    } else {
      console.log("Logged in!", data);
      setUser(data.user); // Set the user globally in context
      navigate('/dashboard'); // Redirect to dashboard
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      console.log("Error sending password reset email:", error.message);
    } else {
      console.log("Password reset email sent!", data);
      setResetEmailSent(true); // Set state to true after email is sent
    }
  };

  const AppleSVG = (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5" viewBox="0 0 256 315"><path fill="white" d="M213.803 167.03c.442 47.58 41.74 63.413 42.197 63.615c-.35 1.116-6.599 22.563-21.757 44.716c-13.104 19.153-26.705 38.235-48.13 38.63c-21.05.388-27.82-12.483-51.888-12.483c-24.061 0-31.582 12.088-51.51 12.871c-20.68.783-36.428-20.71-49.64-39.793c-27-39.033-47.633-110.3-19.928-158.406c13.763-23.89 38.36-39.017 65.056-39.405c20.307-.387 39.475 13.662 51.889 13.662c12.406 0 35.699-16.895 60.186-14.414c10.25.427 39.026 4.14 57.503 31.186c-1.49.923-34.335 20.044-33.978 59.822M174.24 50.199c10.98-13.29 18.369-31.79 16.353-50.199c-15.826.636-34.962 10.546-46.314 23.828c-10.173 11.763-19.082 30.589-16.678 48.633c17.64 1.365 35.66-8.964 46.64-22.262"/></svg>
  );

  const GoogleSVG = (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5" viewBox="0 0 256 262"><path fill="white" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"/><path fill="white" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"/><path fill="white" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"/><path fill="white" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"/></svg>
  );

  // If user is logged in, display the welcome message and logout button
  if (user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-4xl">Welcome, {user.email}!</h1>
        <button
          onClick={logout}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-full"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Section with Image */}
      <div className="w-1/2 flex items-center justify-center">
        <img
          src={WelcomeImage}
          alt="Illustration"
          className="object-contain w-full mt-[-20%]"
        />
      </div>

      {/* Right Section */}
      <div className="w-1/2 flex flex-col justify-center relative">
        {/* Sign up link at top right */}
        <div className="absolute top-4 right-4">
          <BackgroundButton text={"Don't have an account? Sign Up"} bgColor={"green"}/>
        </div>

        {/* Login Form in the middle */}
        <div className="w-4/5 mx-auto p-8">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-300">Sign in</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Sign in with</p>
          <div className="flex space-x-4 mt-4">
            <BackgroundButton text="Google" image={GoogleSVG} flip wWidth="w-full" bgColor={"red"}/>
            <BackgroundButton text="Apple" image={AppleSVG} flip wWidth="w-full" bgColor={"red"}/>
          </div>

          {/* Email and Password Input */}
          <div className="mt-8">
            <p className="text-gray-600 dark:text-gray-400">Or continue with email address</p>
            <div className="mt-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-500 ml-4">
                Email address
              </label>
              <FancyInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="mt-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-500 ml-4">
                Password
              </label>
              <FancyInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {/* Forgot Password */}
            <div className="mt-4 text-right">
              <button onClick={handlePasswordReset} className="text-blue-500 hover:underline">
                Forgot Password?
              </button>
            </div>

            {resetEmailSent && (
              <p className="mt-2 text-green-500">Password reset email sent!</p>
            )}

            <div className="mt-6">
              <BackgroundButton text="Start Learning" onClick={handleLogin} bgColor={"blue"} wWidth="w-full"/>
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
      className="w-full px-4 py-2 text-left rounded-full bg-gray-500 text-white background-shadow background-focus focus:outline-none"
    />
  );
}