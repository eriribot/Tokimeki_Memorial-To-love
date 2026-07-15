import { useState, type ChangeEvent } from 'react';
import { useCardStore } from '../stores/cardStore';
import './CardImporter.css';

export default function CardImporter() {
  const [isOpen, setIsOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const addCardFromFile = useCardStore(state => state.addCardFromFile);
  const addCardFromURL = useCardStore(state => state.addCardFromURL);

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await addCardFromFile(file);

    setLoading(false);

    if (result.success) {
      setSuccess(`成功导入角色：${result.character.name}`);
      setTimeout(() => {
        setSuccess(null);
        setIsOpen(false);
      }, 2000);
    } else {
      setError(result.error || '导入失败');
    }
  };

  const handleURLImport = async () => {
    if (!urlInput.trim()) {
      setError('请输入URL');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await addCardFromURL(urlInput.trim());

    setLoading(false);

    if (result.success) {
      setSuccess(`成功导入角色：${result.character.name}`);
      setUrlInput('');
      setTimeout(() => {
        setSuccess(null);
        setIsOpen(false);
      }, 2000);
    } else {
      setError(result.error || '导入失败');
    }
  };

  if (!isOpen) {
    return (
      <button className="card-importer-toggle" onClick={() => setIsOpen(true)}>
        + 导入角色卡片
      </button>
    );
  }

  return (
    <div className="card-importer-panel">
      <div className="card-importer-header">
        <h3>导入角色卡片</h3>
        <button className="close-button" onClick={() => setIsOpen(false)}>
          ×
        </button>
      </div>

      <div className="card-importer-content">
        <div className="import-section">
          <h4>从文件导入</h4>
          <p className="section-desc">支持 .json 和 .png 格式的SillyTavern卡片</p>
          <label className="file-input-label">
            <input
              type="file"
              accept=".json,.png,application/json,image/png"
              onChange={handleFileSelect}
              disabled={loading}
            />
            <span className="file-input-button">{loading ? '导入中...' : '选择文件'}</span>
          </label>
        </div>

        <div className="import-divider">或</div>

        <div className="import-section">
          <h4>从URL导入</h4>
          <p className="section-desc">输入卡片JSON或PNG的直链</p>
          <div className="url-input-group">
            <input
              type="url"
              className="url-input"
              placeholder="https://example.com/character.json"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              disabled={loading}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleURLImport();
                }
              }}
            />
            <button className="import-button" onClick={handleURLImport} disabled={loading || !urlInput.trim()}>
              导入
            </button>
          </div>
        </div>

        {error && <div className="import-message error">❌ {error}</div>}

        {success && <div className="import-message success">✅ {success}</div>}
      </div>
    </div>
  );
}
