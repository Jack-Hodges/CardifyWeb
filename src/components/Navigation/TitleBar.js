import { useState } from "react";import BackgroundButton from "../Elements/BackgroundButton";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../UserContext";
import ProfileModal from "../Profile/ProfileModal";

function TitleBar( { text, content }) {

  // images

  const navigate = useNavigate();
  const { profile, logout, theme } = useUser()
  const { primaryColor } = theme;
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const dashBoard = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
      <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
    </svg>
  )

  const create = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
    </svg>
  )

  const practice = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
    </svg>
  )

  const home = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
      <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
      <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
    </svg>
  )

  const quiz = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
      <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
      <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
    </svg>
  )

  const Arrows = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  )

  const Cards = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
      <path d="M9.4 7.53333C9.2 7.26667 8.8 7.26667 8.6 7.53333L6.225 10.7C6.09167 10.8778 6.09167 11.1222 6.225 11.3L8.6 14.4667C8.8 14.7333 9.2 14.7333 9.4 14.4667L11.775 11.3C11.9083 11.1222 11.9083 10.8778 11.775 10.7L9.4 7.53333Z"/>
      <path d="M4.09245 5.63868C4.03647 5.5547 4.03647 5.4453 4.09245 5.36133L4.79199 4.31202C4.89094 4.16359 5.10906 4.16359 5.20801 4.31202L5.90755 5.36132C5.96353 5.4453 5.96353 5.5547 5.90755 5.63867L5.20801 6.68798C5.10906 6.83641 4.89094 6.83641 4.79199 6.68798L4.09245 5.63868Z"/>
      <path d="M13.208 15.312C13.1091 15.1636 12.8909 15.1636 12.792 15.312L12.0924 16.3613C12.0365 16.4453 12.0365 16.5547 12.0924 16.6387L12.792 17.688C12.8909 17.8364 13.1091 17.8364 13.208 17.688L13.9075 16.6387C13.9635 16.5547 13.9635 16.4453 13.9075 16.3613L13.208 15.312Z"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M1 4C1 2.34315 2.34315 1 4 1H14C15.1323 1 16.1181 1.62732 16.6288 2.55337L20.839 3.68148C22.4394 4.11031 23.3891 5.75532 22.9603 7.35572L19.3368 20.8787C18.908 22.4791 17.263 23.4288 15.6626 23L8.19849 21H4C2.34315 21 1 19.6569 1 18V4ZM17 18V4.72339L20.3213 5.61334C20.8548 5.75628 21.1714 6.30461 21.0284 6.83808L17.405 20.361C17.262 20.8945 16.7137 21.2111 16.1802 21.0681L15.1198 20.784C16.222 20.3403 17 19.261 17 18ZM4 3C3.44772 3 3 3.44772 3 4V18C3 18.5523 3.44772 19 4 19H14C14.5523 19 15 18.5523 15 18V4C15 3.44772 14.5523 3 14 3H4Z"/>
    </svg>
  )

  const Bolt = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  )

  const logoutUser = () => {
    logout()
    navigate('/');
  } 

  const [isOpen, setIsOpen] = useState(false);

  const images = {
    Dashboard: dashBoard,
    Create: create,
    Practice: practice,
    Home: home,
    Quiz: quiz,
    Scramble: Arrows,
    Memory: Cards,
    Dash: Bolt,
  };
  
  var firstImg = images[text] || null;

  return (
    <div className="flex justify-between px-4 my-2">
      {/* Drop Down Navigation */}
      <div className="relative inline-block text-left z-50">
        {/* Use BackgroundButton as the main button */}
        <BackgroundButton
          text={text}
          bgColor={theme ? `${primaryColor.bgClass} ${primaryColor.hoverClass}` : 'bg-green-500 hover:bg-green-400'}
          wWidth="w-44"
          image={firstImg}
          flip
          onClick={() => setIsOpen(!isOpen)}
        />

        {/* Dropdown options with animation */}
        <div
          className={`p-1 absolute text-white text-xl font-bold left-0 mt-2 w-44 ${primaryColor.bgClass} ${theme ? theme.shadowClass : 'background-shadow'} rounded-3xl transform transition-all duration-300 origin-top ${
            isOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
          }`}
          style={{ transformOrigin: 'top' }} // Ensure the dropdown opens from the top
        >
          <LinkButton text="Home" img={home} hoverClass={primaryColor.hoverClass}/>
          <LinkButton text="Dashboard" img={dashBoard} hoverClass={primaryColor.hoverClass}/>
          <LinkButton text="Create" img={create} hoverClass={primaryColor.hoverClass}/>
          <LinkButton text="Practice" img={practice} hoverClass={primaryColor.hoverClass}/>
          <LinkButton text="Quiz" img={quiz} hoverClass={primaryColor.hoverClass}/>
        </div>
      </div>

      {/* User Profile and Additional Content */}
      <div className="flex gap-2">
        {content}
        <div className={`w-10 h-10 rounded-full bg-black flex items-center justify-center ${theme ? theme.shadowClass : 'background-shadow'} background-hover cursor-pointer`}
          onClick={() => setIsProfileOpen(true)}>
          <p className="text-white font-bold text-xl">{profile?.first_name?.charAt(0) || 'U'}</p>
        </div>
      </div>

      <ProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        logout={logoutUser}
        profile={profile}
      />
    </div>
  )
}

export default TitleBar;

function LinkButton({ text, img, hoverClass }) {
  const navigate = useNavigate();
  const textLower = text.toLowerCase();

  const handleClick = () => {
    // Pass null subject to force refresh
    navigate(`/${textLower}`, { state: { subject: null } });
  };

  return (
    <div onClick={handleClick} className={`flex items-center justify-start ${hoverClass} p-1 w-full rounded-3xl cursor-pointer`}>
      {img}
      <span className="ml-2">{text}</span>
    </div>
  );
}