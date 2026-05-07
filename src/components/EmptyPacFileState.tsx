
import React from 'react';
import { FileCode } from 'lucide-react';

interface EmptyPacFileStateProps {
  onAddPacFile: () => void;
}

const EmptyPacFileState: React.FC<EmptyPacFileStateProps> = ({ onAddPacFile }) => {
  return (
    <div className="p-12 text-center">
      <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <FileCode className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No PAC files to display</h3>
      <p className="text-gray-500 mb-6">
        Get started by creating your first PAC file to manage proxy configurations.
      </p>
      <button
        onClick={onAddPacFile}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Add PAC file
      </button>
    </div>
  );
};

export default EmptyPacFileState;
