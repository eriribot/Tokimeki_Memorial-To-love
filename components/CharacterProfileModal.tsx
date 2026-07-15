import { useState } from 'react';
import CharacterPortrait from './CharacterPortrait';
import '../styles/components/CharacterProfileModal.css';

/**
 * 地图中的角色档案入口与弹窗。
 *
 * 组件只管理弹窗开关，人物筛选、当前角色和角色切换继续由 CharacterPortrait 负责。
 * 这样档案展示方式可以独立调整，不会影响游戏状态与角色数据来源。
 */
export default function CharacterProfileModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 档案入口固定在游戏画面上方，不参与地图布局，也不再保留侧栏或抽屉语义。 */}
      <button
        className="profile-modal-trigger"
        onClick={() => setIsOpen(true)}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="打开角色档案"
      >
        <span className="profile-modal-trigger-icon" aria-hidden="true">
          ♡
        </span>
        <span className="profile-modal-trigger-text">档案</span>
      </button>

      {isOpen && (
        <div
          className="profile-modal-overlay"
          role="presentation"
          onClick={event => {
            // 只有点击半透明遮罩本身时才关闭，点击档案内容不会误关弹窗。
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            className="profile-modal-window"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
          >
            {/* 标题栏独立于滚动内容，角色资料较长时关闭按钮仍保持可见。 */}
            <header className="profile-modal-header">
              <div>
                <p className="profile-modal-eyebrow">CHARACTER FILE</p>
                <h2 id="profile-modal-title">角色档案</h2>
              </div>
              <button
                className="profile-modal-close"
                onClick={() => setIsOpen(false)}
                type="button"
                aria-label="关闭角色档案"
              >
                ×
              </button>
            </header>

            {/* 复用原有角色资料组件，避免复制人物筛选和切换逻辑。 */}
            <div className="profile-modal-content">
              <CharacterPortrait />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
