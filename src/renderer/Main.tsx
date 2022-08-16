/* eslint-disable prettier/prettier */
import {
  MemoryRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from 'react-router-dom';
// import { ipcRenderer } from 'electron';
import { TextField } from '@mui/material';
import './Main.css';
import { useState } from 'react';
import googleLogin from '../../assets/google_button.png'
import naverLogin from '../../assets/naver_button.png'
import kakaoLogin from '../../assets/kakao_button.png'

import { Button } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import styled from '@emotion/styled';

const CssTextField = styled(TextField)({
  '& label.Mui-focused': {
    color: '#d7d7fa',
  },
  '& .MuiInput-underline:after': {
    borderBottomColor: '#d7d7fa',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'black',
    },
    '&:hover fieldset': {
      borderColor: '#d7d7fa',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#d7d7fa',
    },
  },
});

const Main = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const idOnChange = (event: any) => {
    setId(event.target.value.trim());
  };
  const pwOnChange = (event: any) => {
    setPassword(event.target.value.trim());
  };

  const getToken = (e: any) => {
    e.preventDefault();
    let token = window.electron.store.get('accessToken');
    console.log(token);
  };

  const loginHandler = async () => {
    const result = await window.electron.user.login(id, password);
    if (result.message === 'success') {
      if(result.result.auth === 0) {
        alert("이메일 인증을 해주세요.")
        return ;
      }
      
      window.electron.store.set('accessToken', result.result.accessToken);
      window.electron.store.set('nickname', result.result.nickname);
      window.electron.store.set('emailAuth', result.result.auth);
      
      setIsLogin(true);
      navigate('/auth');
    } else {
      console.log(result)
      alert('로그인 실패');
    }
  };

  const openAuthWindow = () => {
    window.electron.web.openAuthWindow();
  };

  const signUpHandler = () => {
    const webUrl = window.electron.store.get('WEB_URL');
    window.open(`${webUrl}/user/signup`, 'Oktta');
  };

  const webHandler = () => {
    const webUrl = window.electron.store.get('WEB_URL');
    window.open(`${webUrl}`, 'Oktta');
  };

  window.electron.ipcRenderer.once('authLogin', (arg: any) => {
    console.log(arg);
    setIsLogin(true);
    navigate('/auth');
  });

  return (
    <div id="main-div">
      <div className="top-div">
        <h1 className="title" onClick={webHandler}>
          OKTTA
        </h1>
      </div>
      <div className="middle-div">
        <div className="input-div">
          <CssTextField
            id="email"
            placeholder="EMAIL"
            // variant="standard"

            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ padding: 0 }}>
                  <EmailIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
                </InputAdornment>
              ),
            }}
            type="email"
            value={id}
            fullWidth
            onChange={idOnChange}
          />
          <CssTextField
            id="password"
            placeholder="PASSWORD"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ padding: 0 }}>
                  <LockIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
                </InputAdornment>
              ),
            }}
            type="password"
            value={password.trim()}
            onChange={pwOnChange}
            fullWidth
          />
          <Button
            onClick={loginHandler}
            sx={{
              width: '100%',
              color: 'white',
              padding: '15px 0px',
              backgroundColor: 'black',
              '&:hover': {
                color: 'white',
                backgroundColor: '#4f4f4f',
              },
            }}
          >
            로그인
          </Button>

          <Button
            onClick={signUpHandler}
            sx={{
              width: '100%',
              color: 'black',
              padding: '15px 0px',
              backgroundColor: 'white',
              '&:hover': {
                color: 'black',
                backgroundColor: '#cacaca',
              },
            }}
          >
            회원가입
          </Button>
        </div>

        <div className='social-login-form'>
            <span>
              <img
                src={googleLogin}
                className="social-login-button"
                alt="구글 로그인 버튼"
                onClick={openAuthWindow}
              />
            </span>
            <span>
              <img
                src={naverLogin}
                className="social-login-button"
                alt="네이버 로그인 버튼"
                onClick={openAuthWindow}
              />
            </span>
            <span>
              <img 
                src={kakaoLogin}
                className="social-login-button"
                alt="카카오 로그인 버튼"
                onClick={openAuthWindow}
              />
            </span>
          </div>
      </div>
      <div className="footer-div"></div>
      {/*<label>아이디</label><input value={id} onChange={idOnChange}/>
      <button onClick={getToken}>tttttttttt</button>
      <br />
      <label>비밀번호</label><input value={password} onChange={pwOnChange}/>
      <button onClick={openAuthWindow}>창열기ㅣㅣㅣ</button>
      {isLogin ? <div>성공</div> : <div>나는 바보야</div>}
      
      <Link to="/auth">인증하기</Link> */}
    </div>
  );
};

export default Main;
