
import React, { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import PacFileModal from '@/components/modals/PacFileModal';
import ConfirmationDialog from '@/components/modals/ConfirmationDialog';
import PacFilesTable from '@/components/PacFilesTable';
import EmptyPacFileState from '@/components/EmptyPacFileState';
import { usePacFiles } from '@/hooks/usePacFiles';

const ExplicitForwardProxy: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete' | 'inactive' | null;
    fileId: string | null;
  }>({
    isOpen: false,
    type: null,
    fileId: null
  });

  const {
    pacFiles,
    handleUpload,
    handleGenerate,
    handleDelete,
    handleMarkActive,
    handleMarkInactive,
    handleDownload
  } = usePacFiles();

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Global Secure Access', path: '/global-secure-access' },
    { label: 'Explicit Forward Proxy' }
  ];

  const openConfirmDialog = (type: 'delete' | 'inactive', fileId: string) => {
    setConfirmDialog({
      isOpen: true,
      type,
      fileId
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      type: null,
      fileId: null
    });
  };

  const handleConfirmAction = () => {
    if (confirmDialog.fileId) {
      if (confirmDialog.type === 'delete') {
        handleDelete(confirmDialog.fileId);
      } else if (confirmDialog.type === 'inactive') {
        handleMarkInactive(confirmDialog.fileId);
      }
    }
  };

  const handleDeleteWithConfirm = (id: string) => {
    openConfirmDialog('delete', id);
  };

  const handleMarkInactiveWithConfirm = (id: string) => {
    openConfirmDialog('inactive', id);
  };

  return (
    <div className="p-6">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Explicit Forward Proxy</h1>
        <p className="text-gray-600">
          Manage PAC (Proxy Auto-Configuration) files to define how web browsers and other user agents 
          automatically choose the appropriate proxy server for fetching a given URL.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add PAC File
            </button>
            
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {pacFiles.length === 0 ? (
          <EmptyPacFileState onAddPacFile={() => setIsModalOpen(true)} />
        ) : (
          <PacFilesTable
            pacFiles={pacFiles}
            onDelete={handleDeleteWithConfirm}
            onMarkActive={handleMarkActive}
            onMarkInactive={handleMarkInactiveWithConfirm}
            onDownload={handleDownload}
          />
        )}
      </div>

      <PacFileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={handleUpload}
        onGenerate={handleGenerate}
      />

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirmAction}
        title="Are you sure?"
        message={
          confirmDialog.type === 'delete' 
            ? 'This action will permanently delete the PAC file.'
            : 'This action will mark the PAC file as inactive.'
        }
        helperText="If users have configured proxy settings with this PAC file URL, security policies configured may no longer be applied and their access to resources may be disrupted."
        confirmText={confirmDialog.type === 'delete' ? 'Delete' : 'Mark Inactive'}
        confirmVariant={confirmDialog.type === 'delete' ? 'danger' : 'default'}
      />
    </div>
  );
};

export default ExplicitForwardProxy;
