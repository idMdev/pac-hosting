
import React, { useState, useEffect } from 'react';
import { X, Upload, FileCode } from 'lucide-react';

interface PacFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  onGenerate: (profile: string) => void;
}

const PacFileModal: React.FC<PacFileModalProps> = ({ isOpen, onClose, onUpload, onGenerate }) => {
  const [selectedOption, setSelectedOption] = useState<'upload' | 'generate' | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Reset modal state when it opens
  useEffect(() => {
    if (isOpen) {
      setSelectedOption(null);
      setSelectedProfile('');
      setIsDragOver(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
      onClose();
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      onUpload(file);
      onClose();
    }
  };

  const handleGenerate = () => {
    if (selectedProfile) {
      onGenerate(selectedProfile);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add PAC File</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {!selectedOption && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">Choose how you want to add a PAC file:</p>
              
              <button
                onClick={() => setSelectedOption('upload')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center">
                  <Upload className="w-6 h-6 text-blue-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Upload PAC File</h3>
                    <p className="text-sm text-gray-500">Upload an existing PAC file from your computer</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedOption('generate')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center">
                  <FileCode className="w-6 h-6 text-blue-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Generate PAC File</h3>
                    <p className="text-sm text-gray-500">Create a new PAC file using predefined profiles</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {selectedOption === 'upload' && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop your PAC file here, or</p>
                <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 transition-colors">
                  Choose File
                  <input
                    type="file"
                    accept=".pac,.js"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">Supported formats: .pac, .js</p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedOption(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {selectedOption === 'generate' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Access Profile
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'internet', label: 'Internet Access', description: 'Allow access to internet resources only' },
                    { value: 'private', label: 'Private Access', description: 'Allow access to private network resources only' },
                    { value: 'both', label: 'Internet and Private Access', description: 'Allow access to both internet and private resources' }
                  ].map((profile) => (
                    <label key={profile.value} className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="profile"
                        value={profile.value}
                        checked={selectedProfile === profile.value}
                        onChange={(e) => setSelectedProfile(e.target.value)}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{profile.label}</div>
                        <div className="text-sm text-gray-500">{profile.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedOption(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!selectedProfile}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PacFileModal;
