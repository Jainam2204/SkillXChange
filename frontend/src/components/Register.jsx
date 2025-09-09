import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [skillsHave, setSkillsHave] = useState([]);
  const [skillsWant, setSkillsWant] = useState([]);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const user = useAuth();
  if (user) navigate("/dashboard");

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("All fields are required!");
      return;
    }
    try {
      const response = await axios.post("http://localhost:5000/auth/register", {
        name,
        email,
        password,
        skillsHave,
        skillsWant,
      });
      if (response.status === 200) {
        setUserId(response.data.userId);
        setStep(2);
      }
      toast.success("Verify your email to complete registration!");
      setError("");
    } catch (error) {
      toast.error("Registration failed. Check your credentials.");
      setError("Registration failed. Please try again.");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/auth/verify", {
        userId,
        verificationCode,
      });
      
      if (response.status === 200){
        setError("");
        toast.success("Email verified successfully!");
        setStep(3);
      } 
    } catch (error) {
      toast.error("Verification failed. Check your code.");
      setError("Verification failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {step === 1 ? "Register" : "Verify Email"}
        </h2>
        {error && <p className="text-red-500 text-center">{error}</p>}

        {step === 1 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded"/>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded"/>
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded"/>

            <input type="text" placeholder="Skills you have (max 3, comma separated)"
              value={skillsHave.join(", ")}
              onChange={(e) => {
                const skillsArray = e.target.value.split(",").map(skill => skill.trim());
                if (skillsArray.length <= 3) setSkillsHave(skillsArray);
              }}
              className="w-full p-2 border rounded"/>

            <input type="text" placeholder="Skills you want to learn (max 3, comma separated)"
              value={skillsWant.join(", ")}
              onChange={(e) => {
                const skillsArray = e.target.value.split(",").map(skill => skill.trim());
                if (skillsArray.length <= 3) setSkillsWant(skillsArray);
              }}
              className="w-full p-2 border rounded"/>

            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
              Register
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-center">Enter the verification code sent to your email</p>
            <input type="text" placeholder="Verification Code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} className="w-full p-2 border rounded"/>
            <button type="submit" className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
              Verify
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center">
            <p className="text-green-500">Your email has been verified successfully!</p>
            <a href="/login" className="text-blue-500">Go to Login</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
