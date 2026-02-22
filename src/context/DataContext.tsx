import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ParsedData } from "@/lib/csv-utils";
import { toast } from "sonner";

interface DataContextType {
  data: ParsedData | null;
  setData: (data: ParsedData | null) => void;
  fileName: string;
  setFileName: (name: string) => void;
  previousUploads: Array<{ fileName: string; uploadDate: string; recordCount: number }>;
  loadPreviousUpload: (fileName: string) => void;
  clearAllData: () => void;
}

const STORAGE_KEY = "insightflow_data";
const UPLOADS_KEY = "insightflow_uploads";

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  // Helper to safely access localStorage
  const safeLocalStorage = {
    getItem: (key: string): string | null => {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          return localStorage.getItem(key);
        }
      } catch {
        // localStorage might be disabled or unavailable
      }
      return null;
    },
    setItem: (key: string, value: string): void => {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem(key, value);
        }
      } catch {
        // localStorage might be disabled or full
      }
    },
    removeItem: (key: string): void => {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem(key);
        }
      } catch {
        // localStorage might be disabled
      }
    },
  };

  // Load from localStorage on mount
  const [data, setDataState] = useState<ParsedData | null>(() => {
    try {
      const stored = safeLocalStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate parsed data structure
        if (parsed && Array.isArray(parsed.headers) && Array.isArray(parsed.rows)) {
          return parsed;
        }
      }
      return null;
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      return null;
    }
  });

  const [fileName, setFileNameState] = useState<string>(() => {
    try {
      return safeLocalStorage.getItem(`${STORAGE_KEY}_filename`) || "";
    } catch {
      return "";
    }
  });

  const [previousUploads, setPreviousUploads] = useState<Array<{ fileName: string; uploadDate: string; recordCount: number }>>(() => {
    try {
      const stored = safeLocalStorage.getItem(UPLOADS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever data changes
  const setData = (newData: ParsedData | null) => {
    setDataState(newData);
    try {
      if (newData) {
        safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      } else {
        safeLocalStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to save data to localStorage:", error);
    }
  };

  const setFileName = (name: string) => {
    setFileNameState(name);
    try {
      if (name) {
        safeLocalStorage.setItem(`${STORAGE_KEY}_filename`, name);
      } else {
        safeLocalStorage.removeItem(`${STORAGE_KEY}_filename`);
      }
    } catch (error) {
      console.error("Failed to save filename to localStorage:", error);
    }
  };

  // Add to previous uploads when new data is set
  useEffect(() => {
    if (data && fileName) {
      const uploadInfo = {
        fileName,
        uploadDate: new Date().toISOString(),
        recordCount: data.rows.length,
      };

      setPreviousUploads((prev) => {
        // Remove duplicate if exists and add to beginning
        const filtered = prev.filter((u) => u.fileName !== fileName);
        const updated = [uploadInfo, ...filtered].slice(0, 10); // Keep last 10 uploads
        try {
          safeLocalStorage.setItem(UPLOADS_KEY, JSON.stringify(updated));
        } catch (error) {
          console.error("Failed to save uploads list:", error);
        }
        return updated;
      });
    }
  }, [data, fileName]);

  const loadPreviousUpload = (targetFileName: string) => {
    // Try to load from a separate storage key for that file
    try {
      const fileDataKey = `${STORAGE_KEY}_${targetFileName}`;
      const stored = safeLocalStorage.getItem(fileDataKey);
      if (stored) {
        const parsedData = JSON.parse(stored);
        // Validate data structure before setting
        if (parsedData && Array.isArray(parsedData.headers) && Array.isArray(parsedData.rows)) {
          setData(parsedData);
          setFileName(targetFileName);
        } else {
          toast.error("Invalid data format");
        }
      } else {
        // If not found in separate storage, try to find it in the uploads list
        // and recreate it (this handles edge cases)
        toast.error("Previous upload data not found");
      }
    } catch (error) {
      console.error("Failed to load previous upload:", error);
      toast.error("Failed to load previous upload");
    }
  };

  const clearAllData = () => {
    setData(null);
    setFileName("");
    try {
      safeLocalStorage.removeItem(STORAGE_KEY);
      safeLocalStorage.removeItem(`${STORAGE_KEY}_filename`);
    } catch (error) {
      console.error("Failed to clear data:", error);
    }
  };

  // Save each upload separately for retrieval
  useEffect(() => {
    if (data && fileName) {
      try {
        const fileDataKey = `${STORAGE_KEY}_${fileName}`;
        safeLocalStorage.setItem(fileDataKey, JSON.stringify(data));
      } catch (error) {
        console.error("Failed to save file data:", error);
      }
    }
  }, [data, fileName]);

  return (
    <DataContext.Provider value={{ data, setData, fileName, setFileName, previousUploads, loadPreviousUpload, clearAllData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
