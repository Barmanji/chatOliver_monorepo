import axios from "axios";
import FormData from "form-data";
import { config } from "../../config/config";

export class AuthService {
    static API_BASE_URL = `${config.baseUrl}`;

    async register(
        fullname: string,
        username: string,
        email: string,
        password: string,
        profilePicture: File | undefined,
    ) {
        try {
            const data = new FormData();
            data.append("username", username);
            data.append("email", email);
            data.append("password", password);
            data.append("fullname", fullname);
            if (profilePicture) {
                data.append("profilePicture", profilePicture);
            }

            let config = {
                method: "post",
                maxBodyLength: Infinity,
                url: `${AuthService.API_BASE_URL}/user/register`,
                // headers: { // headers mat add kr laude
                //     "Content-Type": "application/json",
                // },
                // withCredentials: true,
                data: data,
            };

            axios.request(config);
        } catch (error) {
            throw error;
        }
    }

    async login(identifier: string, password: string) {
        try {
            // Determine if identifier is email or username
            const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier);
            const data = JSON.stringify({
                ...(isEmail ? { email: identifier } : { username: identifier }),
                password: password,
            });
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

            const response: any = await axios.request(config);
            localStorage.setItem(
                "AUTH_ACCESS_TOKEN",
                JSON.stringify(response.data.data.accessToken),
            );

            return response.data; // This might contain tokens, user info, etc.
        } catch (error) {
            // It's good practice to re-throw so the component can handle UI specific errors
            throw error;
        }
    }

    async logout() {
        let config = {
            method: "post",
            maxBodyLength: Infinity,
            url: `${AuthService.API_BASE_URL}/user/logout`,
            headers: {},
        };

        axios.request(config);
    }

    async currentUser() {
        try {
            let config = {
                method: "get",
                maxBodyLength: Infinity,
                url: `${AuthService.API_BASE_URL}/user/current-user`,
                headers: {
                    "Content-Type": "application/json",
                },
                withCredentials: true,
            };

            const response = await axios.request(config);
            return response.data?.data || null;
        } catch (error) {
            return null;
        }
    }

    async getAllUsers() {
        try {
            let config = {
                method: "get",
                maxBodyLength: Infinity,
                url: `${AuthService.API_BASE_URL}/user/get-all-users`,
                headers: {
                    "Content-Type": "application/json",
                },
                withCredentials: true,
            };

            const response = await axios.request(config);
            // Assuming the user array is in response.data.data
            return response.data?.data || [];
        } catch (error) {
            throw error;
        }
    }
}
