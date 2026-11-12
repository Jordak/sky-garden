import React from 'react';
import type { DemoMode } from '../types/skyGarden';

interface ResetConfirmModalProps {
  readonly demoMode: DemoMode;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  demoMode,
  onConfirm,
  onCancel,
}) => {
  const isProgression = demoMode === 'progression';

  return (
    <div
      className="pixel-modal-backdrop is-confirm-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-confirm-title"
      data-testid="reset-confirm-dialog"
      onClick={onCancel}
    >
      <div className="pixel-frame reset-confirm-frame" onClick={(e) => e.stopPropagation()}>
        <div className="crt-bezel-header">
          <div className="crt-title-cluster">
            <h2 id="reset-confirm-title" className="pixel-heading">
              {isProgression ? 'RESET PROGRESSION?' : 'RESET SANDBOX?'}
            </h2>
          </div>
          <button type="button" className="pixel-mini-btn" onClick={onCancel}>
            [ESC] CANCEL
          </button>
        </div>

        <p className="reset-confirm-copy">
          {isProgression
            ? 'Are you sure you want to reset Progression Mode? Your Stardust, cataloged Star Atlas galaxies, unlocked furnishings, and North/South sky arrangements will return to zero. Your Sandbox Mode sky will stay untouched.'
            : 'Are you sure you want to restore the default Sandbox showcase? Your Sandbox sky arrangements and room props will return to their starter layout. Your Progression Mode save will stay untouched.'}
        </p>

        <div className="reset-confirm-actions">
          <button type="button" className="pixel-mini-btn" onClick={onCancel}>
            [ESC] CANCEL
          </button>
          <button
            type="button"
            className="pixel-mini-btn btn-danger"
            data-testid="confirm-reset-btn"
            onClick={onConfirm}
          >
            CONFIRM RESET
          </button>
        </div>
      </div>
    </div>
  );
};
