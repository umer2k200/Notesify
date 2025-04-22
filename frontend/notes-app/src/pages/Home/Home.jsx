import React,{useEffect, useState} from 'react';
import Navbar from '../../components/Navbar/Navbar';
import NoteCard from '../../components/Cards/NoteCard';
import {MdAdd} from 'react-icons/md';
import AddEditNotes from './AddEditNotes';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import moment from 'moment';
import Toast from '../../components/ToastMessage/Toast';
import EmptyCard from '../../components/EmptyCard/EmptyCard';
import AddNotesImg from '../../assets/add-doc.png';

const Home = () => {
  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: 'add',
    data:null,
  });

  const [showToastMsg, setShowToastMsg] = useState({
    isShown: false,
    message: '',
    type: 'add',
  });

  const [isSearch, setIsSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allNotes, setAllNotes] = useState([]); 
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  const handleEdit = (noteDetails) => {
    setOpenAddEditModal({isShown:true, type:'edit', data:noteDetails});
  }  

  const showToastMessage = (message, type) => {
    setShowToastMsg({isShown:true, message, type,});
  };
  const handleCloseToast = () => {
    setShowToastMsg({isShown:false, message:''});
  };

  //get user info
  const getUserInfo = async () => {
    try{
      const response = await axiosInstance.get('/get-user');
      if(response.data && response.data.user){
        setUserInfo(response.data.user);
      }
    } catch(err){
      if(err.response.status === 401){
        localStorage.clear();
        navigate('/login');
      }
    }
  };

  //get all notes
  const getAllNotes = async () => {
    setLoading(true);
    try{
      const response = await axiosInstance.get('/get-all-notes');
      if(response.data && response.data.notes){
        setAllNotes(response.data.notes);
      }
    } catch(err){
      console.log(err);
    } finally{
      setLoading(false);
    }
  };

  //delete a note
  const deleteNote = async (data) => {
    const noteId = data._id;

    try{
      const response = await axiosInstance.delete('/delete-note/' + noteId,);

      if(response.data && !response.data.error){
        showToastMessage("Note deleted successfully", "delete");
        getAllNotes();
      }

    } catch(err){
      if(err.response && err.response.data && err.response.data.message){
        console.log(err.response.data.message);
      }
    }
    

  };

  //search for a note
  const onSearchNote = async (query) => {
    try{
      const response = await axiosInstance.get('/search-notes',{
        params: {query},
      });

      if ( response.data && response.data.notes){
        setIsSearch(true);
        setAllNotes(response.data.notes);
      }
    } catch ( err){
      console.log(err);
    }
  };

  const updateIsPinned = async (noteData) => {
    const noteId = noteData._id;
    try{
      const response = await axiosInstance.put('/update-note-pinned/' + noteId, {
        isPinned: !noteData.isPinned,
      });

      if(response.data && response.data.note){
        showToastMessage("Note Pinned Successfully!")
        getAllNotes();
      }
    } catch( err){
      console.log(err);
    }
  }
  
  const handleClearSearch = () => {
    setIsSearch(false);
    getAllNotes();
  }
  
  useEffect(() => {
    getAllNotes();
    getUserInfo();
    return () => {};
  }, []);

  
  
  return (
    <>
      <Navbar  userInfo={userInfo} onSearchNote={onSearchNote} handleClearSearch={handleClearSearch} isLoginPage={false}/>
      <div className='container mx-auto'>
        {loading? (
          < p className='text-center mt-10 text-slate-500'>Loading notes...</p>
        ): 
        allNotes.length>0? 
        (<div className='grid grid-cols-3 gap-4 mt-8'>
          {allNotes.map((item) => (
            <NoteCard 
              key={item._id} 
              title={item.title} 
              date={moment(item.createdOn).format('Do MMM YYYY')} 
              content={item.content} 
              tags={item.tags} 
              isPinned={item.isPinned} 
              onEdit={() => {handleEdit(item)}} 
              onDelete={() => deleteNote(item)} 
              onPinNote={() => updateIsPinned(item)}
            />
          ))}
        </div>) : (
          <EmptyCard imgSrc={AddNotesImg} message={`Start creating your first note! Click the 'Add' button to jot down your thoughts, ideas, and reminders. Let;s get started!`}/>
        )}
      </div>

      <button className='w-16 h-16 flex items-center justify-center rounded-2xl bg-blue-400 hover:bg-blue-600 absolute right-10 bottom-10 hover:cursor-pointer' onClick={()=>{setOpenAddEditModal({isShown:true, type:'add', data:null})}}>
        <MdAdd className='text-[32px] text-white'/>
      </button>

      <Modal 
        isOpen={openAddEditModal.isShown}
        onRequestClose={()=>{}}
        style={{
          overlay:{
            backgroundColor:'rgba(0,0,0,0.2)',
          },
        }}
        contentLabel=''
        className='w-[70%] max-h-3/4 bg-white rounded-md mx-auto mt-14 p-5'
      >
        <AddEditNotes 
          type={openAddEditModal.type}
          noteData={openAddEditModal.data}
          onClose={() => {
            setOpenAddEditModal({isShown:false, type:'add', data:null})
          }}
          getAllNotes={getAllNotes}
          showToastMessage={showToastMessage}
           />
      </Modal>

      <Toast
        isShown={showToastMsg.isShown}
        message={showToastMsg.message}
        type={showToastMsg.type}
        onClose={handleCloseToast}
        />
    </>
  );
}

export default Home;