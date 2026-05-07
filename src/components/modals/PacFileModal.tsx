import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';

interface PacFileModalProps {
  isOpen: boolean;
  mode: 'add' | 'update';
  onClose: () => void;
  onUpload: (file: File) => void;
  targetFileName?: string;
}

const PacFileModal: React.FC<PacFileModalProps> = ({ isOpen, mode, onClose, onUpload, targetFileName }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (isOpen) setIsDragOver(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      onUpload(file);
    }
  };

  const title = mode === 'add' ? 'Add PAC file' : 'Replace PAC file';
  const subtitle = mode === 'add'
    ? 'Upload a PAC file from your computer. It will be hosted at a tenant URL you can paste into Intune, Group Policy, or your MDM.'
    : `Replace the contents of ${targetFileName ?? 'this PAC file'}. The hosted URL will not change — browsers using it will receive the new content on their next fetch.`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">{subtitle}</p>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Drag and drop your PAC file here, or</p>
            <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 transition-colors">
              Choose file
              <input
                type="file"
                accept=".pac,.js"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">Supported formats: .pac, .js</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PacFileModal;
