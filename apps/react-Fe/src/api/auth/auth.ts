import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { config } from "../../config/config";
{
}
export class AuthService {
    static API_BASE_URL = `${config.server}/api/v1`;

    async register(
        fullname: string,
        username: string,
        email: string,
        password: string,
        // pfp: string,
    ) {
        try {
            let data = new FormData();
            data.append("username", username);
            data.append("email", email);
            data.append("password", password);
            data.append("fullname", fullname);
            data.append(
                "profilePicture",
                fs.createReadStream(
                    "/home/barmanji/Downloads/ColorWall/wallhaven-d85d33.jpg",
                ),
            );

            let config = {
                method: "post",
                maxBodyLength: Infinity,
                url: "http://localhost:3004/api/v1/user/register",
                headers: {
                    ...data.getHeaders(),
                },
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
            console.log(localStorage.getItem("AUTH_ACCESS_TOKEN"));
            console.log(response);

            return response.data; // This might contain tokens, user info, etc.
        } catch (error) {
            // It's good practice to re-throw so the component can handle UI specific errors
            throw error;
        }
    }

    async logout() {}
}
