/* eslint-disable prettier/prettier */
import { Button } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import "./TierAuth.css"

const TierAuth = () => {
  const nickname = window.electron.store.get('nickname');
  const [dataStatus, setDataStatus] = useState('notstart');
  const navigate = useNavigate();

  const errorMessage = {
    'notstart': '',
    'client404' : '롤 클라이언트를 켜주세요.',
    'failSummoner' : '소환사 이름을 불러올 수 없습니다.',
    'success': '인증에 성공했습니다. 창을 닫아주세요.',
    'already': '이미 인증된 계정입니다.',
    'fail': '인증에 실패했습니다.', 
    'notfound': '롤 클라이언트를 찾지 못했습니다.'
  }

  const getSummonr = async () => {
    const result = await window.electron.lcu.getLcuProcess();
    
    if(result === 'fail') {
      // alert("롤 클라이언트를 켜주세요.");
      setDataStatus('client404')
      return;
    }

    let portIdx = result.search('--app-port=')+11;
    let pwIdx = result.search('--remoting-auth-token=')+22;
    let lcuPort = "";
    let lcuPw = "";
    if(portIdx !== -1 && pwIdx !== -1) {
      while(result[portIdx] !== '"') {
        lcuPort += result[portIdx];
        portIdx+=1;
      }
      while(result[pwIdx] !== '"') {
        lcuPw += result[pwIdx];
        pwIdx+=1;
      }
      const summoner = await window.electron.lcu.getSummonerName(lcuPort, lcuPw);
      
      if(summoner === 'fail') {
        setDataStatus('failSummoner')
          // alert('소환사 이름을 불러올 수 없습니다.')
        return;
      }

      const springResult = await window.electron.lcu.tierAuth(summoner.displayName);
      console.log(springResult);
      if(springResult.statusCode === 200) {
        if(springResult?.result === 'success') {
          // alert('인증 성공')
          setDataStatus('success')
        } else if (springResult?.result  === "already") {
          setDataStatus('already')
          // alert('이미 인증')
        } else {
          setDataStatus('fail')
        }
      } else if (springResult.statusCode === 401){
        alert("로그인 다시 해주세요")
        navigate('/')
      } else {
        setDataStatus('fail')
        // alert('인증에 실패했습니다.')
      }
    } else {
      setDataStatus('notfound')
      // alert("클라이언트를 찾지 못했습니다.");
    }
    
  }

  const webHandler = () => {
    const webUrl = window.electron.store.get('WEB_URL');
    window.open(`${webUrl}`, 'Oktta');
  };

  return (
    <div id="main-div">
      <div className="top-div">
        {/* <h1>{nickname}</h1> */}
        <h1 className="title" onClick={webHandler}>
          OKTTA
        </h1>
      </div>
      <div className="middle-div">
        <div className="tier-auth-div">
        <Button onClick={getSummonr}
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
          disabled={dataStatus === 'success'}
        >티어 인증하기</Button>
        </div>

        <div className="message-div">
          <Typography sx={{
            color: dataStatus === 'success' ?  "#2b960c" : "#e64848",
            fontWeight: 900,
            fontSize: '1.4rem',
          }}>{errorMessage[dataStatus]}</Typography>      
        </div>
        
      </div>  
      <div className="footer-div"></div>
    </div>
  );
};

export default TierAuth;
