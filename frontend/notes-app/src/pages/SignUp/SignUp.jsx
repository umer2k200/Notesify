import React,{useState} from 'react'
import Navbar from '../../components/Navbar/Navbar'
import PasswordInput from '../../components/Input/PasswordInput';
import { Link, useNavigate } from 'react-router-dom';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance';
const SignUp = () => {

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if(!name){
      setError('Please enter a name');
      return;
    }
    if(!validateEmail(email)){
      setError('Please enter a valid email address');
      return;
    }
    if(!password){
      setError('Please enter a password');
      return;
    }
    setError(null);

    // Sign Up API call
    try{
      const response = await axiosInstance.post('/create-account', {
        fullName: name,
        email:email,
        password:password,
      });

      if(response.data && response.data.error){
        setError(response.data.message);
        return;
      }

      if(response.data && response.data.accessToken){
        localStorage.setItem('token', response.data.accessToken);
        navigate('/login');
      }
    } catch(err){
      if(err.response && err.response.data && err.response.data.message){
        setError(err.response.data.message);
      } else {
        setError('An error occurred. Please try again later.');
      }
    }
  }

  return (
    <>
      <Navbar isLoginPage={true}/>
      <div className='flex items-center justify-center mt-28'>
        <div className='w-96 border rounded bg-white px-7 py-10'>
          <form onSubmit={handleSignUp}>
            <h4 className='text-2xl mb-7'>Sign Up</h4>
            <input 
              type='text' 
              placeholder='Name' 
              className='input-box'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input 
              type='text' 
              placeholder='Email' 
              className='input-box'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Password'
            />

            {error && <p className='text-red-500 text-xs pb-1'>{error}</p>}

            <button type='submit' className='btn-primary hover:cursor-pointer hover:bg-blue-600'>
              Create Account
            </button>

            <p className='text-sm text-center mt-4'>
              Already have an account?{' '} 
              <Link to='/login' className='font-medium text-blue-500 underline hover:cursor-pointer hover:text-blue-600'>
                Login
              </Link>
            </p>

          </form>
        </div>
      </div>
    </>
  )
}

export default SignUp