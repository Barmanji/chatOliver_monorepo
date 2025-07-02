import axios from 'axios';

const API_BASE_URL = `${import.meta.env.BASE_URL}/api/v1`;
console.log()

export const loginUser = async (usernameOrEmail: string, password: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/login`, {
      usernameOrEmail: usernameOrEmail, // Or 'email', depending on your API
      password,
    });
    return response.data; // This might contain tokens, user info, etc.
  } catch (error) {
    // It's good practice to re-throw so the component can handle UI specific errors
    throw error;
  }
};
