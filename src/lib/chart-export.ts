import html2canvas from "html2canvas";

/**
 * Exports a chart container element as PNG
 */
export async function exportChartAsPNG(
  chartContainerId: string,
  filename: string = "chart.png"
): Promise<void> {
  const element = document.getElementById(chartContainerId);
  if (!element) {
    throw new Error(`Chart container with id "${chartContainerId}" not found`);
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
    });

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error exporting chart:", error);
    throw error;
  }
}
