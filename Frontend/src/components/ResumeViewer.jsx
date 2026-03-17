export default function ResumeViewer({ url, onClose }) {
  if (!url) return null;

  // Convert raw URL to image URL for proper PDF viewing
  const viewUrl = url
    .replace("/raw/upload/", "/image/upload/")
    .replace("fl_attachment:false/", "")
    .replace("fl_inline/", "");

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-900">Resume</p>
          <div className="flex items-center gap-3">
            <a
              href={viewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              Open in new tab
            </a>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
        <iframe
          src={viewUrl}
          className="flex-1 w-full border-0"
          title="Resume"
        />
      </div>
    </div>
  );
}