import React from "react";

interface SearchResult {
    name: string;
}

interface SearchResultsListProps {
    results: SearchResult[];
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
    results,
}) => {
    const handleResultClick = (resultName: string) => {
        alert(`You selected ${resultName}!`);
    };

    return (
        <div className="results-list">
            {results.map((result, id) => {
                return (
                    <div
                        key={id}
                        className="search-result"
                        onClick={() => handleResultClick(result.name)}
                    >
                        {result.name}
                    </div>
                );
            })}
        </div>
    );
};
