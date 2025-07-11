import React, { useEffect, useState } from 'react';
import { formatFileSize } from './utils/helpers';
import { MAX_CONCURRENT } from './utils/constants';

interface UploadedFile {
  file: File;
  relativePath: string;
  size: number;
  status: 'Queued' | 'Uploading' | 'Completed' | 'Failed';
  controller?: AbortController;
}

const FolderUpload: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [paused, setPaused] = useState(false);

  const handleFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    const uploadedFiles: UploadedFile[] = Array.from(fileList)
      .filter(file => {
        const path = file.webkitRelativePath || file.name;
        const pathParts = path.split('/');
        return pathParts.length <= 3;
      })
      .map(file => ({
        file,
        relativePath: file.webkitRelativePath || file.name,
        size: file.size,
        status: 'Queued',
      }));

    console.log(uploadedFiles);

    setFiles(uploadedFiles);
  };

  const uploadFile = (uploadFile: UploadedFile, index: number) => {
    const controller = new AbortController();
    setFiles(prev => {
      const updated = [...prev];
      updated[index] = { ...uploadFile, status: 'Uploading', controller };
      return updated;
    });
  };

  useEffect(() => {
    if (paused) return;

    const queuedFiles = files.filter(f => f.status === 'Queued');
    const uploadingFiles = files.filter(f => f.status === 'Uploading');

    if (queuedFiles.length > 0 && uploadingFiles.length < MAX_CONCURRENT) {
      const nextFileIndex = files.findIndex(f => f.status === 'Queued');
      if (nextFileIndex !== -1) {
        uploadFile(files[nextFileIndex], nextFileIndex);
      }
    }
  }, [files, paused]);

  const pauseUploads = () => {
    setPaused(true);
    files.forEach(f => f.controller?.abort());
  };

  const resumeUploads = () => {
    setPaused(false);
  };

  //api integration

  return (
    <div>
      <label>
        <input
          type="file"
          {...({
            webkitdirectory: '',
            directory: '',
          } as React.InputHTMLAttributes<HTMLInputElement>)}
          multiple
          onChange={handleFolderChange}
        />
        Select Folder
      </label>
      <table
        style={{ borderCollapse: 'collapse', width: '100%', marginTop: '20px' }}
      >
        <thead>
          <tr>
            <th
              style={{
                border: '1px solid #ddd',
                padding: '8px',
                textAlign: 'left',
              }}
            >
              File Path
            </th>
            <th
              style={{
                border: '1px solid #ddd',
                padding: '8px',
                textAlign: 'left',
              }}
            >
              Size (bytes)
            </th>
            <th
              style={{
                border: '1px solid #ddd',
                padding: '8px',
                textAlign: 'left',
              }}
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((f, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {f.relativePath}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {formatFileSize(f.size)}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {f.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={pauseUploads}>Pause</button>
      <button onClick={resumeUploads}>Resume</button>
    </div>
  );
};

export default FolderUpload;
