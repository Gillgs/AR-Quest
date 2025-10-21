import React, { useState } from 'react';
import { X } from 'react-feather';

const CreateModuleModal = ({ 
  colors, 
  spacing, 
  borderRadius, 
  handleClose, 
  handleCreateModule, 
  newModuleName,
  setNewModuleName,
  newModuleDescription,
  setNewModuleDescription,
  newModuleDifficulty,
  setNewModuleDifficulty,
  newModuleDuration,
  setNewModuleDuration,
  newModuleObjectives,
  setNewModuleObjectives,
  userRole
  , subjectColor
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const onClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      handleClose();
      setIsClosing(false);
    }, 200);
  };

  const commonInputStyles = {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    border: `2px solid ${colors.borderColor}`,
    width: '100%',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
    fontFamily: 'inherit',
    background: '#ffffff',
    color: '#333333'
  };

  const labelStyles = {
    display: 'block',
    marginBottom: spacing.xs,
    fontSize: '0.9rem',
    fontWeight: 600,
    color: colors.textColor
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)'
      }}
  // clicking the backdrop no longer closes the modal; require explicit close
    >
      <div
        style={{
          background: colors.contentBg,
          padding: spacing['2xl'],
          borderRadius: borderRadius.xl,
          minWidth: 500,
          maxWidth: 600,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          transform: isClosing ? 'scale(0.95)' : 'scale(1)',
          transition: 'transform 0.2s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.lg
        }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.5rem', color: '#000', margin: 0 }}>
            Create New Module
          </h2>
          <button
            onClick={onClose}
            aria-label="Close create module"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: spacing.sm,
              borderRadius: borderRadius.default,
              color: colors.mutedText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X size={20} color={colors.danger} />
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); handleCreateModule(); }}>
          <div style={{ marginBottom: spacing.md }}>
            <label htmlFor="module-name" style={labelStyles}>
              Module Name *
            </label>
            <input
              id="module-name"
              type="text"
              value={newModuleName}
              onChange={e => setNewModuleName(e.target.value)}
              placeholder="Enter module name..."
              style={commonInputStyles}
              onFocus={e => e.target.style.borderColor = subjectColor || colors.primary}
              onBlur={e => e.target.style.borderColor = colors.borderColor}
              disabled={userRole === 'student'}
              required
            />
          </div>

          <div style={{ marginBottom: spacing.md }}>
            <label htmlFor="module-description" style={labelStyles}>
              Module Description
            </label>
            <textarea
              id="module-description"
              value={newModuleDescription}
              onChange={e => setNewModuleDescription(e.target.value)}
              placeholder="Enter module description (optional)..."
              rows={3}
              style={{
                ...commonInputStyles,
                resize: 'vertical',
                minHeight: '80px'
              }}
              onFocus={e => e.target.style.borderColor = subjectColor || colors.primary}
              onBlur={e => e.target.style.borderColor = colors.borderColor}
              disabled={userRole === 'student'}
            />
          </div>

          <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.md }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="module-difficulty" style={labelStyles}>
                Difficulty Level
              </label>
              <select
                id="module-difficulty"
                value={newModuleDifficulty}
                onChange={e => setNewModuleDifficulty(parseInt(e.target.value))}
                style={{
                  ...commonInputStyles,
                  cursor: 'pointer'
                }}
                onFocus={e => e.target.style.borderColor = subjectColor || colors.primary}
                onBlur={e => e.target.style.borderColor = colors.borderColor}
                disabled={userRole === 'student'}
              >
                <option value={1}>1 - Beginner</option>
                <option value={2}>2 - Basic</option>
                <option value={3}>3 - Intermediate</option>
                <option value={4}>4 - Advanced</option>
                <option value={5}>5 - Expert</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label htmlFor="module-duration" style={labelStyles}>
                Duration (minutes)
              </label>
              <input
                id="module-duration"
                type="number"
                value={newModuleDuration}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '') setNewModuleDuration('');
                  else setNewModuleDuration(Math.max(1, parseInt(val)));
                }}
                min="1"
                max="600"
                style={commonInputStyles}
                onFocus={e => e.target.style.borderColor = subjectColor || colors.primary}
                onBlur={e => e.target.style.borderColor = colors.borderColor}
                disabled={userRole === 'student'}
              />
            </div>
          </div>

          <div style={{ marginBottom: spacing.lg }}>
            <label style={labelStyles}>
              Learning Objectives (optional)
            </label>
            {newModuleObjectives.map((objective, index) => (
              <div key={index} style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.sm }}>
                <input
                  type="text"
                  value={objective}
                  onChange={e => {
                    const newObjectives = [...newModuleObjectives];
                    newObjectives[index] = e.target.value;
                    setNewModuleObjectives(newObjectives);
                  }}
                  placeholder={`Learning objective ${index + 1}...`}
                  style={commonInputStyles}
                  onFocus={e => e.target.style.borderColor = subjectColor || colors.primary}
                  onBlur={e => e.target.style.borderColor = colors.borderColor}
                  disabled={userRole === 'student'}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newObjectives = [...newModuleObjectives];
                    newObjectives.splice(index, 1);
                    setNewModuleObjectives(newObjectives);
                  }}
                  style={{
                    padding: spacing.sm,
                    borderRadius: borderRadius.md,
                    border: `2px solid ${colors.borderColor}`,
                    background: 'transparent',
                    color: colors.danger,
                    cursor: 'pointer'
                  }}
                  disabled={userRole === 'student'}
                  // keep hover neutral
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setNewModuleObjectives([...newModuleObjectives, ''])}
              style={{
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                border: `2px solid ${subjectColor || colors.primaryLight}`,
                background: subjectColor || colors.primaryLight,
                color: '#fff',
                cursor: 'pointer'
              }}
              disabled={userRole === 'student'}
              onMouseEnter={e => { e.currentTarget.style.opacity = 0.95 }}
              onMouseLeave={e => { e.currentTarget.style.opacity = 1 }}
            >
              Add Objective
            </button>
          </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.md }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: spacing.md,
                borderRadius: borderRadius.md,
                border: `2px solid ${colors.borderColor}`,
                background: 'transparent',
                color: colors.textColor,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newModuleName.trim() || userRole === 'student'}
              style={{
                  padding: `${spacing.md}px ${spacing.lg}px`,
                  borderRadius: borderRadius.md,
                  border: `2px solid ${subjectColor || colors.primaryLight}`,
                  background: subjectColor || colors.primaryLight,
                  color: '#fff',
                  cursor: (!newModuleName.trim() || userRole === 'student') ? 'not-allowed' : 'pointer',
                  opacity: (!newModuleName.trim() || userRole === 'student') ? 0.6 : 1
              }}
            >
              Create Module
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateModuleModal;
