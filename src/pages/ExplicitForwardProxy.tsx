import React, { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import PacFileModal from '@/components/modals/PacFileModal';
import ConfirmationDialog from '@/components/modals/ConfirmationDialog';
import PacFilesTable from '@/components/PacFilesTable';
import { usePacFiles } from '@/hooks/usePacFiles';

type ConfirmType = 'delete' | 'deactivate' | 'update';

const ExplicitForwardProxy: React.FC = () => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'update';
    targetId: string | null;
  }>({
    isOpen: false,
    mode: 'add',
    targetId: null,
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: ConfirmType | null;
    fileId: string | null;
    pendingFile?: File | null;
  }>({
    isOpen: false,
    type: null,
    fileId: null,
    pendingFile: null,
  });

  const {
    pacFiles,
    handleUpload,
    handleUpdate,
    handleDelete,
    handleMarkActive,
    handleMarkInactive,
    handleDownload,
  } = usePacFiles();

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Global Secure Access', path: '/global-secure-access' },
    { label: 'Explicit Forward Proxy' },
  ];

  const openAddModal = () => setModalState({ isOpen: true, mode: 'add', targetId: null });
  const openUpdateModal = (id: string) => setModalState({ isOpen: true, mode: 'update', targetId: id });
  const closeModal = () => setModalState({ isOpen: false, mode: 'add', targetId: null });

  const handleModalUpload = (file: File) => {
    if (modalState.mode === 'add') {
      handleUpload(file);
      closeModal();
    } else if (modalState.mode === 'update' && modalState.targetId) {
      const targetId = modalState.targetId;
      closeModal();
      setConfirmDialog({
        isOpen: true,
        type: 'update',
        fileId: targetId,
        pendingFile: file,
      });
    }
  };

  const openConfirm = (type: ConfirmType, fileId: string) => {
    setConfirmDialog({ isOpen: true, type, fileId, pendingFile: null });
  };

  const closeConfirm = () => {
    setConfirmDialog({ isOpen: false, type: null, fileId: null, pendingFile: null });
  };

  const handleConfirmAction = () => {
    if (!confirmDialog.fileId) return;
    if (confirmDialog.type === 'delete') {
      handleDelete(confirmDialog.fileId);
    } else if (confirmDialog.type === 'deactivate') {
      handleMarkInactive(confirmDialog.fileId);
    } else if (confirmDialog.type === 'update' && confirmDialog.pendingFile) {
      handleUpdate(confirmDialog.fileId, confirmDialog.pendingFile);
    }
  };

  const targetFile = pacFiles.find(f => f.id === modalState.targetId);

  const confirmCopy: Record<ConfirmType, {
    title: string;
    message: string;
    helperText: string;
    confirmText: string;
    variant: 'danger' | 'default';
  }> = {
    delete: {
      title: 'Delete this PAC file?',
      message: 'This permanently removes the PAC file and stops its hosted URL from responding.',
      helperText: 'Browsers configured to fetch this PAC URL will fail to receive proxy configuration. They may bypass GSA security policy until reconfigured with a different URL.',
      confirmText: 'Delete',
      variant: 'danger',
    },
    deactivate: {
      title: 'Deactivate this PAC file?',
      message: 'The hosted URL will stop returning proxy configuration content.',
      helperText: 'Browsers configured to fetch this PAC URL will stop receiving proxy settings on their next refresh. They may bypass GSA security policy until reconfigured.',
      confirmText: 'Deactivate',
      variant: 'default',
    },
    update: {
      title: 'Replace this PAC file?',
      message: 'The hosted URL stays the same. Its contents will change immediately.',
      helperText: 'Browsers configured to fetch this PAC URL will receive the new content on their next fetch. Proxy behavior may change without warning to end users.',
      confirmText: 'Replace',
      variant: 'default',
    },
  };

  const copy = confirmDialog.type ? confirmCopy[confirmDialog.type] : null;

  return (
    <div className="p-6">
      <Breadcrumb items={breadcrumbItems} />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Explicit Forward Proxy</h1>
        <p className="text-gray-600">
          Manage PAC (Proxy Auto-Configuration) files used to point browsers and other user agents at Global Secure Access. A default PAC file is always available.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={openAddModal}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add PAC file
            </button>

            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        <PacFilesTable
          pacFiles={pacFiles}
          onDelete={(id) => openConfirm('delete', id)}
          onMarkActive={handleMarkActive}
          onMarkInactive={(id) => openConfirm('deactivate', id)}
          onDownload={handleDownload}
          onUpdate={openUpdateModal}
        />
      </div>

      <PacFileModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        onClose={closeModal}
        onUpload={handleModalUpload}
        targetFileName={targetFile?.name}
      />

      {copy && (
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={closeConfirm}
          onConfirm={handleConfirmAction}
          title={copy.title}
          message={copy.message}
          helperText={copy.helperText}
          confirmText={copy.confirmText}
          confirmVariant={copy.variant}
        />
      )}
    </div>
  );
};

export default ExplicitForwardProxy;
