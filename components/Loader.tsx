
import React from 'react';

const Loader: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
            <h2 className="mt-6 text-xl font-semibold text-slate-700">Processing your data...</h2>
            <p className="mt-2 text-slate-500">This might take a moment for large files.</p>
        </div>
    );
};

export default Loader;
