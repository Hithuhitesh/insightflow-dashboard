import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, CheckCircle2, Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseCSV, ParsedData } from "@/lib/csv-utils";
import { useData } from "@/context/DataContext";
import { PreviousUploads } from "@/components/PreviousUploads";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const SAMPLE_DATA: ParsedData = {
  headers: ["Region", "Product", "Revenue", "Units", "Profit", "Category"],
  rows: [
    { Region: "North", Product: "Widget A", Revenue: "12500", Units: "250", Profit: "3750", Category: "Electronics" },
    { Region: "South", Product: "Widget B", Revenue: "9800", Units: "196", Profit: "2940", Category: "Electronics" },
    { Region: "East", Product: "Gadget X", Revenue: "15200", Units: "304", Profit: "4560", Category: "Hardware" },
    { Region: "West", Product: "Gadget Y", Revenue: "8700", Units: "174", Profit: "2610", Category: "Hardware" },
    { Region: "North", Product: "Service Pro", Revenue: "22000", Units: "110", Profit: "8800", Category: "Services" },
    { Region: "South", Product: "Service Lite", Revenue: "14500", Units: "290", Profit: "5800", Category: "Services" },
    { Region: "East", Product: "Widget A", Revenue: "11300", Units: "226", Profit: "3390", Category: "Electronics" },
    { Region: "West", Product: "Widget B", Revenue: "7600", Units: "152", Profit: "2280", Category: "Electronics" },
    { Region: "North", Product: "Gadget X", Revenue: "18900", Units: "378", Profit: "5670", Category: "Hardware" },
    { Region: "South", Product: "Gadget Y", Revenue: "6400", Units: "128", Profit: "1920", Category: "Hardware" },
    { Region: "East", Product: "Service Pro", Revenue: "25600", Units: "128", Profit: "10240", Category: "Services" },
    { Region: "West", Product: "Service Lite", Revenue: "13200", Units: "264", Profit: "5280", Category: "Services" },
    { Region: "North", Product: "Widget C", Revenue: "9100", Units: "182", Profit: "2730", Category: "Electronics" },
    { Region: "South", Product: "Gadget Z", Revenue: "16800", Units: "336", Profit: "5040", Category: "Hardware" },
    { Region: "East", Product: "Service Max", Revenue: "31000", Units: "155", Profit: "12400", Category: "Services" },
  ],
};

export function CSVUploader() {
  const { setData, setFileName, data, fileName } = useData();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }
    setIsLoading(true);
    try {
      const parsed = await parseCSV(file);
      if (!parsed || !Array.isArray(parsed.headers) || !Array.isArray(parsed.rows)) {
        toast.error("Invalid file: could not read CSV structure.");
        setIsLoading(false);
        return;
      }
      if (parsed.headers.length === 0) {
        toast.error("Missing columns: no headers found in the file.");
        setIsLoading(false);
        return;
      }
      if (parsed.rows.length === 0) {
        toast.error("Empty dataset: no data rows found.");
        setIsLoading(false);
        return;
      }
      
      // Set data and filename - use callback to ensure it's set
      console.log("Setting data:", { headers: parsed.headers.length, rows: parsed.rows.length });
      
      // Set data synchronously
      setData(parsed);
      setFileName(file.name);
      
      // Force a synchronous localStorage write
      try {
        localStorage.setItem("insightflow_data", JSON.stringify(parsed));
        localStorage.setItem("insightflow_data_filename", file.name);
        console.log("Data saved to localStorage synchronously");
      } catch (e) {
        console.error("Error saving to localStorage:", e);
      }
      
      toast.success(`Loaded ${parsed.rows.length} records from ${file.name}`);
      
      // Use setTimeout to ensure React processes the state update
      setTimeout(() => {
        navigate("/");
      }, 100);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      toast.error("Failed to parse CSV file");
    } finally {
      setIsLoading(false);
    }
  }, [setData, setFileName, navigate]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Upload Data</h2>
        <p className="text-muted-foreground mt-1">Import your CSV file to start analyzing</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
          isDragging ? "border-primary bg-accent/50" : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("csv-input")?.click()}
      >
        <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={handleChange} />
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-primary-foreground" />
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {isLoading ? "Processing file..." : "Drop your CSV file here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">or click to browse files</p>
          </div>
          <Button variant="outline" size="sm" disabled={isLoading}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Select File
          </Button>
          <p className="text-xs text-muted-foreground mt-2">or</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              console.log("Loading sample data");
              
              // Set data synchronously
              setData(SAMPLE_DATA);
              setFileName("sample-business-data.csv");
              
              // Force a synchronous localStorage write
              try {
                localStorage.setItem("insightflow_data", JSON.stringify(SAMPLE_DATA));
                localStorage.setItem("insightflow_data_filename", "sample-business-data.csv");
                console.log("Sample data saved to localStorage synchronously");
              } catch (err) {
                console.error("Error saving sample data:", err);
              }
              
              toast.success(`Loaded ${SAMPLE_DATA.rows.length} sample records`);
              
              // Use setTimeout to ensure React processes the state update
              setTimeout(() => {
                navigate("/");
              }, 100);
            }}
          >
            <Database className="h-4 w-4 mr-2" />
            Load Sample Data
          </Button>
        </div>
      </motion.div>

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <div>
            <p className="text-sm font-medium text-foreground">{fileName}</p>
            <p className="text-xs text-muted-foreground">{data.rows.length} records · {data.headers.length} columns</p>
          </div>
        </motion.div>
      )}

      <PreviousUploads />
    </div>
  );
}
