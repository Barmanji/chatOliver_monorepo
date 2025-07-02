import axios from "axios";
import { config } from "../../config/config";
{
}
export class AuthService {
    static API_BASE_URL = `${config.server}/api/v1`;

    async register() {}

    async login(identifier: string, password: string) {
        try {
            // Determine if identifier is email or username
            const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier);
            const data = JSON.stringify({
                ...(isEmail ? { email: identifier } : { username: identifier }),
                password: password,
            });

            // Debug log to see what is being sent
            console.log("Sending login data:", data);
            const config = {
                method: "post",
                maxBodyLength: Infinity,
                url: `${AuthService.API_BASE_URL}/user/login`,
                headers: {
                    "Content-Type": "application/json",
                },
                data: data,
                withCredentials: true,
            };

            const response = await axios.request(config);
            return response.data; // This might contain tokens, user info, etc.
        } catch (error) {
            // It's good practice to re-throw so the component can handle UI specific errors
            throw error;
        }
    }

    async logout() {}
}
