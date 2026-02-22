import { motion } from "framer-motion";
import { Clock, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/DataContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function PreviousUploads() {
  const { previousUploads, loadPreviousUpload, fileName } = useData();
  const navigate = useNavigate();

  if (previousUploads.length === 0) {
    return null;
  }

  const handleLoad = (uploadFileName: string) => {
    try {
      loadPreviousUpload(uploadFileName);
      toast.success(`Loaded ${uploadFileName}`);
      navigate("/"); // Navigate to dashboard after loading
    } catch (error) {
      toast.error("Failed to load previous upload");
    }
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all previous uploads? This cannot be undone.")) {
      try {
        localStorage.removeItem("insightflow_uploads");
        // Also clear individual file storage
        previousUploads.forEach((upload) => {
          localStorage.removeItem(`insightflow_data_${upload.fileName}`);
        });
        window.location.reload(); // Reload to refresh the list
      } catch (error) {
        toast.error("Failed to clear uploads");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Previous Uploads</h3>
        {previousUploads.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {previousUploads.map((upload, index) => {
          const isCurrent = upload.fileName === fileName;
          const uploadDate = new Date(upload.uploadDate);
          
          return (
            <motion.div
              key={upload.fileName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                isCurrent
                  ? "bg-accent border-accent-foreground/20"
                  : "bg-background border-border hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {upload.fileName}
                    {isCurrent && (
                      <span className="ml-2 text-xs text-muted-foreground">(Current)</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(uploadDate, { addSuffix: true })}
                    </p>
                    <span className="text-xs text-muted-foreground">·</span>
                    <p className="text-xs text-muted-foreground">
                      {upload.recordCount.toLocaleString()} records
                    </p>
                  </div>
                </div>
              </div>
              {!isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoad(upload.fileName)}
                  className="ml-2"
                >
                  Load
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
