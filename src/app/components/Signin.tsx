// components/Login.js
import React from 'react';
import { auth, provider, signInWithPopup } from '@/lib/firebase';

const Login = () => {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("使用者登入成功：", result.user);
    } catch (error) {
      console.error("登入失敗：", error);
    }
  };

  return (
    <div>
      <h2>Google SSO 登入</h2>
      <button onClick={handleLogin}>Google 登入</button>
    </div>
  );
};

export default Login;
