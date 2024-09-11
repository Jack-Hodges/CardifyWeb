// Import card manipulation to interact with Supabase
import { useEffect, useState } from 'react';
import TitleBar from '../components/Navigation/TitleBar';

import supabase from '../supabaseClient';

function Dashboard() {

    useEffect(() => {
        fetchSubjects()
    }, []);

    const [subjects, setSubjects] = useState([]);

    const fetchSubjects = async () => {
        try {
          const { data, error } = await supabase
            .from('subjects') // Table name in Supabase
            .select('*')
      
          if (error) {
            console.error('Error fetching subjects:', error);
            return [];
          }
      
          console.log('Flashcards fetched from Supabase:', data);
          setSubjects(data);
          return data;
        } catch (error) {
          console.error('Unexpected error fetching subjects:', error);
          return [];
        }
      };

    return (
    <div className="w-screen h-screen">

      <TitleBar text="Dashboard" />

      <div class="grid grid-cols-4 p-4 gap-2">
      {subjects.map((subject, index) => (
         <SubjectBlock bgCol={subject.bgCol} subName={subject.name} cardNum={3} />
        ))}
      </div>

    </div>
  );
}

export default Dashboard;

function SubjectBlock( { bgCol, subName, cardNum }) {

    return (
        <div class={`relative w-56 h-56 ${bgCol} rounded-xl background-shadow background-hover cursor-pointer`} >
            <div class="absolute bottom-0 left-0 ml-1 mb-1">
                <h1 class="text-3xl font-bold text-white">{subName}</h1>    
                <p class="text-lg text-white font-bold">{cardNum} cards</p>
            </div>
            
        </div>
    );
}