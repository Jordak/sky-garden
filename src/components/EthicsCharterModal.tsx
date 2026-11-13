import React, { useState } from 'react';
import {
  ETHICS_PILLARS,
  GALAXY_ZOO_TALK_URL,
  OFFLINE_PRACTICE_AI_DISCLOSURE,
  REPO_FEEDBACK_URL,
  ZOONIVERSE_AI_ETHICS_URL,
} from '../data/aiEthicsCharter';

interface EthicsCharterModalProps {
  readonly onExportJson: () => void;
  readonly onWipeAllLocalData: () => void;
  readonly onClose: () => void;
}

export const EthicsCharterModal: React.FC<EthicsCharterModalProps> = ({
  onExportJson,
  onWipeAllLocalData,
  onClose,
}) => {
  const [confirmingWipe, setConfirmingWipe] = useState<boolean>(false);

  return (
    <div
      className="pixel-modal-backdrop is-confirm-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ethics-modal-title"
      data-testid="ethics-charter-modal"
      onClick={onClose}
    >
      <div className="pixel-frame ethics-modal-frame" onClick={(e) => e.stopPropagation()}>
        <div className="crt-bezel-header">
          <div className="crt-title-cluster">
            <h2 id="ethics-modal-title" className="pixel-heading">
              AI &amp; DATA ETHICS CHARTER
            </h2>
            <span className="pixel-tag tag-cyan">ALIGNED WITH ZOONIVERSE AI ETHICS</span>
          </div>
          <button type="button" className="pixel-mini-btn" onClick={onClose}>
            [ESC] CLOSE
          </button>
        </div>

        <div className="crt-practice-disclaimer">
          <strong>{OFFLINE_PRACTICE_AI_DISCLOSURE.workflowBadge}:</strong>{' '}
          {OFFLINE_PRACTICE_AI_DISCLOSURE.liveIntegrationPolicy}
        </div>

        <div className="ethics-pillars-grid">
          {ETHICS_PILLARS.map((pillar) => (
            <section key={pillar.id} className="ethics-pillar-card">
              <h3>{pillar.heading}</h3>
              <p className="ethics-principle-quote">{pillar.principle}</p>
              <p>{pillar.implementation}</p>
            </section>
          ))}
        </div>

        <div className="ethics-data-bar">
          <div className="ethics-data-copy">
            <strong>LOCAL DATA &amp; PRIVACY GUARANTEE</strong>
            <span>
              All progress stays in browser localStorage (sky-garden.*). Zero cookies, accounts, or
              network requests occur during play.
            </span>
          </div>
          <div className="ethics-data-actions">
            <button type="button" className="pixel-mini-btn btn-cyan" onClick={onExportJson}>
              EXPORT MY LOCAL JSON
            </button>
            {!confirmingWipe ? (
              <button
                type="button"
                data-testid="wipe-all-data-btn"
                className="pixel-mini-btn btn-danger"
                onClick={() => setConfirmingWipe(true)}
              >
                CLEAR ALL LOCAL DATA
              </button>
            ) : (
              <div className="ethics-wipe-confirm">
                <button
                  type="button"
                  data-testid="confirm-wipe-all-btn"
                  className="pixel-mini-btn btn-danger"
                  onClick={() => {
                    setConfirmingWipe(false);
                    onWipeAllLocalData();
                  }}
                >
                  CONFIRM WIPE ALL LOCAL SAVES
                </button>
                <button
                  type="button"
                  data-testid="cancel-wipe-all-btn"
                  className="pixel-mini-btn"
                  onClick={() => setConfirmingWipe(false)}
                >
                  CANCEL
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="ethics-community-footer">
          <a
            href={ZOONIVERSE_AI_ETHICS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pixel-mini-btn pixel-ext-link"
          >
            ZOONIVERSE AI ETHICS FRAMEWORK ↗
          </a>
          <a
            href={GALAXY_ZOO_TALK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pixel-mini-btn btn-cyan pixel-ext-link"
          >
            GALAXY ZOO TALK BOARDS ↗
          </a>
          <a
            href={REPO_FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pixel-mini-btn pixel-ext-link"
          >
            PROJECT FEEDBACK &amp; ISSUES ↗
          </a>
        </div>
      </div>
    </div>
  );
};
