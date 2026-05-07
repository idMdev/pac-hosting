import React from 'react';
import { MoreHorizontal, Download, Copy, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export interface PacFile {
  id: string;
  name: string;
  type: 'default' | 'uploaded';
  dateCreated: string;
  dateModified: string;
  status: 'active' | 'inactive';
  isActive: boolean;
  url: string;
}

interface PacFilesTableProps {
  pacFiles: PacFile[];
  onDelete: (id: string) => void;
  onMarkActive: (id: string) => void;
  onMarkInactive: (id: string) => void;
  onDownload: (id: string) => void;
  onUpdate: (id: string) => void;
}

const PacFilesTable: React.FC<PacFilesTableProps> = ({
  pacFiles,
  onDelete,
  onMarkActive,
  onMarkInactive,
  onDownload,
  onUpdate,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyUrl = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Modified</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pacFiles.map((file) => {
            const isDefault = file.type === 'default';
            return (
              <tr key={file.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{file.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    isDefault ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isDefault ? 'Default' : 'Uploaded'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.dateCreated}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.dateModified}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    file.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {file.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline truncate max-w-xs"
                      title={file.url}
                    >
                      {file.url}
                    </a>
                    <button
                      onClick={() => copyUrl(file.id, file.url)}
                      className="p-1 text-gray-400 hover:text-gray-700 rounded"
                      title="Copy URL"
                    >
                      {copiedId === file.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => !isDefault && onUpdate(file.id)}
                        disabled={isDefault}
                        className={isDefault ? 'text-gray-400 cursor-not-allowed' : ''}
                        title={isDefault ? 'The default PAC file is read-only and cannot be replaced.' : undefined}
                      >
                        Replace
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDownload(file.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      {file.isActive ? (
                        <DropdownMenuItem onClick={() => onMarkInactive(file.id)}>
                          Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onMarkActive(file.id)}>
                          Activate
                        </DropdownMenuItem>
                      )}
                      {!isDefault && (
                        <DropdownMenuItem
                          onClick={() => onDelete(file.id)}
                          className="text-red-600 focus:text-red-700"
                        >
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PacFilesTable;
