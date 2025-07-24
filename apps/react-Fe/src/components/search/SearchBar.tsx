import { useState } from "react";
import { Search } from "lucide-react";
import { AuthService } from "../../api/auth/auth";

export const SearchBar: React.FC<{ onUserSelect: (user: any) => void }> = ({ onUserSelect }) => {
    const [input, setInput] = useState<string>("");
    const [results, setResults] = useState<any[]>([]);
    const auth = new AuthService();

    const fetchData = async (value: string) => {
        try {
            const userArr = await auth.getAllUsers(); // arr of users
            const results = userArr.filter((user: any) => {
                return (
                    value &&
                    user &&
                    user.username &&
                    user.fullname &&
                    user.username.toLowerCase().includes(value.toLowerCase())
                );
            });
            setResults(results);
        } catch (error) {
            setResults([]);
        }
    };

    const handleChange = (value: string) => {
        setInput(value);
        fetchData(value);
    };

    return (
        <div className="input-wrapper">
            <Search />
            <input
                placeholder="Type to search..."
                value={input}
                onChange={(e) => handleChange(e.target.value)}
            />
            {results.length > 0 && (
                <ul className="search-results">
                    {results.map((user) => (
                        <li
                            key={user._id}
                            className="search-result-item"
                            onClick={() => onUserSelect(user)}
                        >
                            {user.username} - {user.fullname}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
