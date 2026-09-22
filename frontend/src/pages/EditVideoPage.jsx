import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getVideoById, updateVideo } from '../services/videoService';
import { useAuth } from '../context/AuthContext';
import {
  Save,
  ArrowLeft,
  Film,
  Sparkles,
  Tag,
  Check,
  X,
  Plus,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  FileCheck
} from 'lucide-react';

const TALENT_CATEGORIES = [
  'Dance & Movement',
  'Singing & Vocals',
  'Acting & Drama',
  'Choreography',
  'Art & Design',
  'Music & Production',
  'Photography & Film',
  'Public Speaking',
  'Tech & Programming',
  'Creative Performance'
];

const EditVideoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(TALENT_CATEGORIES[0]);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [status, setStatus] = useState('published');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true);
        const data = await getVideoById(id);
        if (data?.video) {
          const v = data.video;
          // Verify ownership
          const creatorId = v.creator?._id || v.creator;
          if (authUser && creatorId && authUser._id !== creatorId && authUser.username !== v.creator?.username) {
            navigate(`/v/${id}`, { replace: true });
            return;
          }

          setTitle(v.title || '');
          setDescription(v.description || '');
          setCategory(v.category || TALENT_CATEGORIES[0]);
          setSkills(v.skills || []);
          setStatus(v.status || 'published');
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Failed to load video details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadVideo();
    }
  }, [id, authUser, navigate]);

  const handleAddSkill = (e) => {
    if (e) e.preventDefault();
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skills.length >= 20) {
      setErrorMsg('Maximum 20 skills allowed.');
      return;
    }
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('Skill is already added.');
      return;
    }
    setSkills([...skills, trimmed]);
    setSkillInput('');
    setErrorMsg('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim() || title.trim().length < 3 || title.trim().length > 100) {
      setErrorMsg('Title must be between 3 and 100 characters.');
      return;
    }

    try {
      setSaving(true);
      const result = await updateVideo(id, {
        title: title.trim(),
        description: description.trim(),
        category,
        skills,
        status
      });

      if (result.success) {
        setSuccessMsg('Video metadata updated successfully!');
        setTimeout(() => {
          navigate(`/v/${id}`);
        }, 1200);
      } else {
        setErrorMsg(result.message || 'Failed to update video.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Error updating video.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '14px', color: 'var(--text-secondary)' }}>
        <RefreshCw size={32} className="spin" color="var(--accent-purple)" />
        <p>Loading video details...</p>
      </div>
    );
  }

  return (
    <div className="auth-page-container" style={{ padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Link to={`/v/${id}`} className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} />
            <span>Back to Video</span>
          </Link>
        </div>

        <div className="glass-card" style={{ padding: '36px 32px' }}>
          <div style={{ marginBottom: '28px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Edit Showcase Metadata</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
              Update your video title, description, categories, skills, and visibility.
            </p>
          </div>

          {successMsg && (
            <div className="auth-alert success" style={{ marginBottom: '20px' }}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="auth-alert error" style={{ marginBottom: '20px' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="title">
                Video Title <span style={{ color: 'var(--accent-pink)' }}>*</span>
              </label>
              <input
                id="title"
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                disabled={saving}
                required
              />
              <span className="form-hint">{title.length} / 100</span>
            </div>

            {/* Talent Category */}
            <div className="form-group">
              <label className="form-label">
                <Sparkles size={14} style={{ marginRight: '5px', verticalAlign: '-1px' }} />
                Talent Category <span style={{ color: 'var(--accent-pink)' }}>*</span>
              </label>
              <div className="chips-container">
                {TALENT_CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`chip-btn ${isSelected ? 'active' : ''}`}
                      disabled={saving}
                    >
                      {isSelected && <Check size={13} />}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form-label" htmlFor="description">
                  Description
                </label>
                <span className="form-hint">{description.length} / 1000</span>
              </div>
              <textarea
                id="description"
                className="form-textarea"
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                disabled={saving}
              />
            </div>

            {/* Skills */}
            <div className="form-group">
              <label className="form-label">
                <Tag size={14} style={{ marginRight: '5px', verticalAlign: '-1px' }} />
                Skills ({skills.length}/20)
              </label>
              <div className="skill-input-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Add skill..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  disabled={saving || skills.length >= 20}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="btn btn-secondary"
                  disabled={saving || !skillInput.trim() || skills.length >= 20}
                >
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </div>

              {skills.length > 0 && (
                <div className="tag-badges-container">
                  {skills.map((skill, index) => (
                    <span key={index} className="skill-edit-pill">
                      <span>{skill}</span>
                      <button type="button" onClick={() => handleRemoveSkill(skill)} className="skill-remove-btn" disabled={saving}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Visibility</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={`chip-btn ${status === 'published' ? 'active' : ''}`}
                  disabled={saving}
                >
                  <Eye size={13} />
                  <span>Published</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`chip-btn ${status === 'draft' ? 'active' : ''}`}
                  disabled={saving}
                >
                  <FileCheck size={13} />
                  <span>Draft</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <Link to={`/v/${id}`} className="btn btn-secondary" disabled={saving}>
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditVideoPage;
