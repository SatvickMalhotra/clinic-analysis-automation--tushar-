
import React, { useState, useCallback } from 'react';
import { ProcessedData, PivotDict, KPIData } from './types';
import { processClaimsFile, generatePivots } from './services/fileProcessor';
import { parseFile } from './services/fileHandlers';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import Loader from './components/Loader';
import { Header } from './components/Header';
import { ErrorDisplay } from './components/ErrorDisplay';

const App: React.FC = () => {
    const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
    const [pivotDict, setPivotDict] = useState<PivotDict | null>(null);
    const [kpis, setKpis] = useState<KPIData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');

    const handleFileProcess = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        setProcessedData(null);
        setPivotDict(null);
        setKpis(null);
        setFileName(file.name);

        try {
            const rawData = await parseFile(file);
            if (!rawData || rawData.length === 0) {
                throw new Error("File is empty or could not be parsed.");
            }
            
            const pData = processClaimsFile(rawData);
            
            if (pData.df_registered.length > 0) {
                const { pivotDict: pivots, kpis: calculatedKpis } = generatePivots(pData.df_registered);
                setPivotDict(pivots);
                setKpis(calculatedKpis);
            } else {
                // Handle case where there's no data for pivoting
                setPivotDict({});
                // FIX: Corrected KPI values to be strings to match the KPIData type definition.
                setKpis({
                    totalRows: '0',
                    sumClaim: '₹0',
                    sumSettled: '₹0',
                    avgTat: '0.0',
                    totalRowsRaw: 0,
                    sumClaimRaw: 0,
                    sumSettledRaw: 0,
                    avgTatRaw: 0,
                });
            }
            
            setProcessedData(pData);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during processing.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleReset = () => {
        setProcessedData(null);
        setPivotDict(null);
        setKpis(null);
        setError(null);
        setIsLoading(false);
        setFileName('');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />
            <main className="container mx-auto p-4 md:p-8">
                {isLoading ? (
                    <Loader />
                ) : error ? (
                    <ErrorDisplay message={error} onReset={handleReset} />
                ) : processedData ? (
                    <Dashboard
                        processedData={processedData}
                        pivotDict={pivotDict}
                        kpis={kpis}
                        onReset={handleReset}
                        fileName={fileName}
                    />
                ) : (
                    <FileUpload onFileProcess={handleFileProcess} />
                )}
            </main>
        </div>
    );
};

export default App;