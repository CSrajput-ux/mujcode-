import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ExternalLink, Download, FileText, Presentation, BookOpen, Image as ImageIcon, Video, Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";

export function getResolvedFileUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function getCleanExtension(fileUrl: string, fileName?: string, fileType?: string): string {
  if (fileName && fileName.includes(".")) {
    const ext = fileName.split(".").pop()?.trim().toLowerCase();
    if (ext && ext.length <= 5) return ext;
  }
  const cleanPath = (fileUrl || "").split("?")[0].split("#")[0];
  const lastSegment = cleanPath.split("/").pop() || "";
  if (lastSegment.includes(".")) {
    const ext = lastSegment.split(".").pop()?.trim().toLowerCase();
    if (ext && ext.length <= 5) return ext;
  }
  if (fileType?.includes("pdf")) return "pdf";
  if (fileType?.includes("presentation") || fileType?.includes("powerpoint")) return "pptx";
  if (fileType?.includes("word") || fileType?.includes("document")) return "docx";
  if (fileType?.startsWith("image/")) return fileType.split("/")[1]?.toLowerCase() || "png";
  if (fileType?.startsWith("video/")) return fileType.split("/")[1]?.toLowerCase() || "mp4";
  return "pdf";
}

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fileUrl: string;
  fileType?: string;
  fileName?: string;
  contentId?: string;
  description?: string;
}

export default function DocumentPreviewModal({
  open,
  onOpenChange,
  title,
  fileUrl,
  fileType = "",
  fileName = "",
  contentId = "",
  description = ""
}: DocumentPreviewModalProps) {
  const [viewerType, setViewerType] = useState<"direct" | "google" | "office">("direct");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fullUrl = getResolvedFileUrl(fileUrl);
  const cleanExt = getCleanExtension(fileUrl, fileName, fileType);

  const base = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
  // Use our backend stream route if contentId is available to guarantee correct inline Content-Type & Content-Disposition
  const previewUrl = contentId ? `${base}/api/content/view/${contentId}` : fullUrl;
  const downloadUrl = contentId ? `${base}/api/content/download/${contentId}` : fullUrl;

  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(cleanExt) || fileType.startsWith("image/");
  const isVideo = ["mp4", "webm", "ogg", "mov"].includes(cleanExt) || fileType.startsWith("video/");
  const isPdf = cleanExt === "pdf" || fileType.includes("pdf") || title.toLowerCase().endsWith(".pdf") || fullUrl.toLowerCase().includes(".pdf");
  const isPpt = ["ppt", "pptx"].includes(cleanExt) || fileType.includes("presentation");
  const isDoc = ["doc", "docx", "txt"].includes(cleanExt) || fileType.includes("word");

  const cleanTitle = (title || fileName || "document").replace(/[^\w\s.-]/g, "").trim().replace(/\s+/g, "_");
  const downloadFileName = fileName && fileName.includes(".")
    ? fileName
    : (cleanTitle.toLowerCase().endsWith(`.${cleanExt}`) ? cleanTitle : `${cleanTitle}.${cleanExt}`);

  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`;
  const officeViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fullUrl)}`;

  const getIcon = () => {
    if (isImage) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (isVideo) return <Video className="w-5 h-5 text-red-500" />;
    if (isPpt) return <Presentation className="w-5 h-5 text-[#FF7A00]" />;
    if (isPdf) return <BookOpen className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-green-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`flex flex-col p-0 gap-0 overflow-hidden bg-white shadow-2xl transition-all duration-200 ${
          isFullScreen
            ? "fixed inset-0 w-screen h-screen max-w-none sm:max-w-none rounded-none top-0 left-0 translate-x-0 translate-y-0 border-0"
            : "w-[96vw] max-w-[96vw] sm:max-w-[96vw] md:max-w-[95vw] lg:max-w-[94vw] xl:max-w-[1450px] h-[94vh] max-h-[96vh] rounded-2xl border border-gray-200"
        }`}
      >
        {/* Header */}
        <DialogHeader className="p-4 border-b border-gray-100 flex flex-row items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200/80 flex items-center justify-center shrink-0">
              {getIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-semibold text-gray-900 truncate">
                  {title}
                </DialogTitle>
                <Badge variant="outline" className="text-xs uppercase font-bold px-2 py-0.5 shrink-0 bg-orange-50 text-orange-700 border-orange-200">
                  {cleanExt.toUpperCase()}
                </Badge>
              </div>
              {description ? (
                <p className="text-xs text-gray-500 truncate mt-0.5 max-w-xl">
                  {description}
                </p>
              ) : (
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {downloadFileName}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2 shrink-0">
            {isPdf ? (
              <div className="hidden sm:flex items-center rounded-lg border border-gray-200 p-0.5 text-xs bg-gray-50">
                <button
                  type="button"
                  onClick={() => setViewerType("direct")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    viewerType === "direct" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Direct PDF
                </button>
                <button
                  type="button"
                  onClick={() => setViewerType("google")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    viewerType === "google" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Google Viewer
                </button>
              </div>
            ) : isPpt || isDoc ? (
              <div className="hidden sm:flex items-center rounded-lg border border-gray-200 p-0.5 text-xs bg-gray-50">
                <button
                  type="button"
                  onClick={() => setViewerType("google")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    viewerType === "google" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Google Viewer
                </button>
                <button
                  type="button"
                  onClick={() => setViewerType("office")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    viewerType === "office" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Office Viewer
                </button>
              </div>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-xs hidden sm:flex items-center justify-center text-gray-600 hover:text-gray-900"
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>

            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Tab</span>
              </Button>
            </a>

            <a href={downloadUrl} download={downloadFileName} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="h-8 gap-1.5 text-xs bg-[#FF7A00] hover:bg-[#FF6A00] text-white font-medium">
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </Button>
            </a>
          </div>
        </DialogHeader>

        {/* Viewer Body */}
        <div className="flex-1 w-full h-full bg-slate-900 relative overflow-hidden flex items-center justify-center">
          {isImage ? (
            <div className="w-full h-full p-4 flex items-center justify-center overflow-auto bg-slate-900">
              <img
                src={previewUrl}
                alt={title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : isVideo ? (
            <div className="w-full h-full p-4 flex items-center justify-center bg-black">
              <video src={previewUrl} controls className="max-w-full max-h-full rounded-lg" autoPlay>
                Your browser does not support HTML5 video.
              </video>
            </div>
          ) : isPdf ? (
            <div className="w-full h-full flex flex-col bg-white">
              <iframe
                key={viewerType}
                src={viewerType === "direct" ? `${previewUrl}#toolbar=1&navpanes=1` : googleViewerUrl}
                className="w-full flex-1 border-0 bg-white"
                title={title}
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col bg-white">
              <iframe
                key={viewerType}
                src={viewerType === "office" ? officeViewerUrl : googleViewerUrl}
                className="w-full flex-1 border-0"
                title={title}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
