import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ProcessedData, PivotDict, KPIData, ClaimRecord } from './types';
import { processClaimsFile, generatePivots } from './services/fileProcessor';
import { parseFile } from './services/fileHandlers';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import DashboardV2 from './components/DashboardV2';
import Loader from './components/Loader';
import { Header } from './components/Header';
import { ErrorDisplay } from './components/ErrorDisplay';
import AdvancedAnalysisModal from './components/AdvancedAnalysisModal';
import { isAfter, isBefore, isEqual } from 'date-fns';

export interface V2Filters {
    dateFrom: string;
    dateTo: string;
    Region: string[];
    State: string[];
    'Filed By': string[];
    Product: string[];
    'Aging Days Bucketing': string[];
}

const App: React.FC = () => {
    const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
    const [pivotDict, setPivotDict] = useState<PivotDict | null>(null);
    const [kpis, setKpis] = useState<KPIData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [view, setView] = useState<'v1' | 'v2'>('v1');
    const [theme, setTheme] = useState<string>('default');
    const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);

    // V2 State
    const [filters, setFilters] = useState<V2Filters | null>(null);
    const [filteredRegisteredData, setFilteredRegisteredData] = useState<ClaimRecord[]>([]);
    const [pivotDictV2, setPivotDictV2] = useState<PivotDict | null>(null);
    const [kpisV2, setKpisV2] = useState<KPIData | null>(null);
    const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});

    const handleFileProcess = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        setProcessedData(null);
        setPivotDict(null);
        setKpis(null);
        setFileName(file.name);
        setView('v1');
        setTheme('default');

        try {
            const rawData = await parseFile(file);
            if (!rawData || rawData.length === 0) {
                throw new Error("File is empty or could not be parsed.");
            }
            
            const pData = processClaimsFile(rawData);
            
            // V1 Data Processing
            if (pData.df_registered.length > 0) {
                const { pivotDict: pivots, kpis: calculatedKpis } = generatePivots(pData.df_registered);
                setPivotDict(pivots);
                setKpis(calculatedKpis);
            } else {
                setPivotDict({});
                setKpis({
                    totalRows: '0', sumClaim: '₹0', sumSettled: '₹0', avgTat: '0.0',
                    totalRowsRaw: 0, sumClaimRaw: 0, sumSettledRaw: 0, avgTatRaw: 0,
                });
            }

            // V2 Initial Setup
            const getUniqueOptions = (key: string) => [...new Set(pData.df_registered.map(row => row[key]).filter(Boolean))].sort() as string[];
            const newFilterOptions = {
                Region: getUniqueOptions('Region'),
                State: getUniqueOptions('State'),
                'Filed By': getUniqueOptions('Filed By'),
                Product: getUniqueOptions('Product'),
                'Aging Days Bucketing': getUniqueOptions('Aging Days Bucketing'),
            };
            setFilterOptions(newFilterOptions);
            
            const initialFilters: V2Filters = {
                dateFrom: '', dateTo: '',
                Region: [], State: [], 'Filed By': [], Product: [], 'Aging Days Bucketing': [],
            };
            setFilters(initialFilters);
            
            setProcessedData(pData);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during processing.');
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    // V2: Effect to filter data and generate new pivots when filters change
    useEffect(() => {
        if (!processedData || !filters) return;

        const filtered = processedData.df_registered.filter(row => {
            // Date filter
            const claimDate = row.parsedClaimIntimationDate as Date | null;
            if (claimDate) {
                if (filters.dateFrom && isBefore(claimDate, new Date(filters.dateFrom))) return false;
                if (filters.dateTo && isAfter(claimDate, new Date(filters.dateTo))) return false;
            } else if (filters.dateFrom || filters.dateTo) {
                return false; // Exclude rows with no date if date filter is active
            }

            // Categorical filters
            for (const key of Object.keys(filterOptions)) {
                const filterValues = filters[key as keyof V2Filters] as string[];
                if (filterValues.length > 0 && !filterValues.includes(String(row[key]))) {
                    return false;
                }
            }
            return true;
        });

        setFilteredRegisteredData(filtered);
        
        const { pivotDict: pivotsV2, kpis: kpisV2 } = generatePivots(filtered);
        setPivotDictV2(pivotsV2);
        setKpisV2(kpisV2);

    }, [processedData, filters, filterOptions]);


    const handleReset = () => {
        setProcessedData(null);
        setPivotDict(null);
        setKpis(null);
        setError(null);
        setIsLoading(false);
        setFileName('');
        setView('v1');
        setTheme('default');
        setFilters(null);
        setFilterOptions({});
        setPivotDictV2(null);
        setKpisV2(null);
    };

    return (
        <div data-theme={view === 'v2' ? theme : 'default'}>
            <div className="min-h-screen bg-slate-50">
                <Header view={view} setView={setView} isFileLoaded={!!processedData} theme={theme} setTheme={setTheme} />
                <main className="container mx-auto p-4 md:p-8">
                    {isLoading ? (
                        <Loader />
                    ) : error ? (
                        <ErrorDisplay message={error} onReset={handleReset} />
                    ) : !processedData ? (
                        <FileUpload onFileProcess={handleFileProcess} />
                    ) : view === 'v1' ? (
                         <Dashboard
                            processedData={processedData}
                            pivotDict={pivotDict}
                            kpis={kpis}
                            onReset={handleReset}
                            fileName={fileName}
                        />
                    ) : (
                        <DashboardV2
                            processedData={processedData}
                            filteredData={filteredRegisteredData}
                            pivotDict={pivotDictV2}
                            kpis={kpisV2}
                            onReset={handleReset}
                            fileName={fileName}
                            filters={filters}
                            setFilters={setFilters}
                            filterOptions={filterOptions}
                            onAdvancedAnalysisClick={() => setAnalysisModalOpen(true)}
                        />
                    )}
                </main>
                {isAnalysisModalOpen && (
                    <AdvancedAnalysisModal
                        isOpen={isAnalysisModalOpen}
                        onClose={() => setAnalysisModalOpen(false)}
                        data={filteredRegisteredData}
                    />
                )}
            </div>
        </div>
    );
};

export default App;