import React from 'react';

interface ThemeSelectorProps {
    theme: string;
    setTheme: (theme: string) => void;
}

const themes = [
    { name: 'default', color: 'bg-indigo-700' },
    { name: 'emerald', color: 'bg-emerald-800' },
    { name: 'crimson', color: 'bg-rose-800' },
    { name: 'slate', color: 'bg-slate-700' },
    { name: 'amber', color: 'bg-amber-700' },
];

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ theme, setTheme }) => {
    return (
        <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-slate-600 hidden sm:block">Theme:</p>
            <div className="flex items-center space-x-2">
                {themes.map((t) => (
                    <button
                        key={t.name}
                        onClick={() => setTheme(t.name)}
                        className={`w-6 h-6 rounded-full ${t.color} focus:outline-none ring-offset-2 ring-primary ${
                            theme === t.name ? 'ring-2' : 'ring-0'
                        }`}
                        aria-label={`Select ${t.name} theme`}
                        title={t.name.charAt(0).toUpperCase() + t.name.slice(1)}
                    />
                ))}
            </div>
        </div>
    );
};


interface HeaderProps {
    view: 'v1' | 'v2';
    setView: (view: 'v1' | 'v2') => void;
    isFileLoaded: boolean;
    theme: string;
    setTheme: (theme: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ view, setView, isFileLoaded, theme, setTheme }) => (
    <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-extrabold text-primary">
                Claims Analysis Dashboard
            </h1>
            {isFileLoaded && (
                 <div className="flex items-center gap-4">
                    {view === 'v2' && <ThemeSelector theme={theme} setTheme={setTheme} />}
                    <div className="p-1 bg-slate-200 rounded-lg flex items-center">
                        <button 
                            onClick={() => setView('v1')}
                            className={`px-4 py-1 text-sm font-bold rounded-md transition-all ${view === 'v1' ? 'bg-primary text-white shadow' : 'text-slate-600'}`}
                            aria-pressed={view === 'v1'}
                        >
                            V1
                        </button>
                        <button 
                            onClick={() => setView('v2')}
                            className={`px-4 py-1 text-sm font-bold rounded-md transition-all ${view === 'v2' ? 'bg-primary text-white shadow' : 'text-slate-600'}`}
                            aria-pressed={view === 'v2'}
                        >
                            V2
                        </button>
                    </div>
                </div>
            )}
        </div>
    </header>
);