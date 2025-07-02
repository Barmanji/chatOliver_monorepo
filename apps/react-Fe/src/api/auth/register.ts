import axios from 'axios';

const API_BASE_URL = `${import.meta.env.BASE_URL}/api/v1`;


export const registerUser = async (username: string, email: string, password: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/register`, { // Assuming /user/register
      username,
      email,
      password,
    });
    return response.data; // This might contain confirmation, tokens, etc.
  } catch (error) {
    throw error;
  }
};



