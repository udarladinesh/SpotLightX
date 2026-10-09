import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { uploadVideo } from '../services/videoService';
import {
  UploadCloud,
  Film,
  Image as ImageIcon,
  Sparkles,
  Tag,
  Check,
  X,
  Plus,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileVideo,
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

const UploadVideoPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const thumbInputRef = useRef(null);

  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(TALENT_CATEGORIES[0]);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [status, setStatus] = useState('published');

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleVideoSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setErrorMsg('Please select a valid video file (MP4, WebM, MOV, MKV).');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setErrorMsg('Video file size exceeds the 100MB maximum limit.');
      return;
    }

    setVideoFile(file);
    setErrorMsg('');

    // Auto-fill title if empty from filename
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleVideoSelect(e.dataTransfer.files[0]);
    }
  };

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

    if (!videoFile) {
      setErrorMsg('Please select a video file to upload.');
      return;
    }

    if (!title.trim() || title.trim().length < 3 || title.trim().length > 100) {
      setErrorMsg('Video title must be between 3 and 100 characters.');
      return;
    }

    if (!category) {
      setErrorMsg('Please select a talent category.');
      return;
    }

    const formData = new FormData();
    formData.append('video', videoFile);
    if (thumbFile) {
      formData.append('thumbnail', thumbFile);
    }
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('category', category);
    formData.append('skills', JSON.stringify(skills));
    formData.append('status', status);

    try {
      setUploading(true);
      setUploadProgress(0);

      const result = await uploadVideo(formData, (percent) => {
        setUploadProgress(percent);
      });

      if (result.success && result.video) {
        setSuccessMsg('Video uploaded and published successfully!');
        setTimeout(() => {
          navigate(`/v/${result.video._id}`);
        }, 1200);
      } else {
        setErrorMsg(result.message || 'Upload failed. Please try again.');
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setErrorMsg('Upload timed out. Please check your internet connection and try again.');
      } else {
        setErrorMsg(err.response?.data?.message || err.message || 'Failed to upload video.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="auth-page-container" style={{ padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: '820px' }}>
        <div className="glass-card" style={{ padding: '36px 32px' }}>
          {/* Header */}
          <div style={{ marginBottom: '28px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="brand-icon" style={{ width: '36px', height: '36px' }}>
                <Film size={20} />
              </div>
              <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Upload Showcase Video</h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
              Showcase your emerging talent on Spotly. Upload high-quality video files (up to 100MB).
            </p>
          </div>

          {/* Success / Error alerts */}
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
            {/* Video File Dropzone */}
            <div className="form-group">
              <label className="form-label">
                Video File <span style={{ color: 'var(--accent-pink)' }}>*</span>
              </label>

              {!videoFile ? (
                <div
                  className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleVideoSelect(e.target.files[0]);
                      }
                    }}
                    disabled={uploading}
                  />
                  <div className="upload-dropzone-icon">
                    <UploadCloud size={36} color="var(--accent-purple)" />
                  </div>
                  <p className="upload-dropzone-title">Click to upload or drag & drop video</p>
                  <p className="upload-dropzone-hint">Supported formats: MP4, WebM, MOV, MKV (Max 100MB)</p>
                </div>
              ) : (
                <div className="selected-file-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="selected-file-icon">
                      <FileVideo size={24} color="var(--accent-cyan)" />
                    </div>
                    <div>
                      <p className="selected-file-name">{videoFile.name}</p>
                      <p className="selected-file-size">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="btn btn-secondary btn-sm"
                    disabled={uploading}
                  >
                    <X size={14} />
                    <span>Change</span>
                  </button>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="title">
                Video Title <span style={{ color: 'var(--accent-pink)' }}>*</span>
              </label>
              <input
                id="title"
                type="text"
                className="form-input"
                placeholder="e.g. Original Hip-Hop Choreography to Midnight Beat"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                disabled={uploading}
                required
              />
              <span className="form-hint">{title.length} / 100 characters</span>
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
                      disabled={uploading}
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
                placeholder="Share the story behind this showcase, the techniques you used, or invite other creators to collaborate..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                disabled={uploading}
              />
            </div>

            {/* Skills & Specialties */}
            <div className="form-group">
              <label className="form-label">
                <Tag size={14} style={{ marginRight: '5px', verticalAlign: '-1px' }} />
                Featured Skills ({skills.length}/20)
              </label>
              <div className="skill-input-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Popping, Freestyle, Sound Design, Solos"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  disabled={uploading || skills.length >= 20}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="btn btn-secondary"
                  disabled={uploading || !skillInput.trim() || skills.length >= 20}
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
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="skill-remove-btn"
                        disabled={uploading}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Custom Thumbnail & Status row */}
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">
                  <ImageIcon size={14} style={{ marginRight: '5px', verticalAlign: '-1px' }} />
                  Custom Thumbnail (Optional)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => thumbInputRef.current?.click()}
                    className="btn btn-secondary btn-sm"
                    disabled={uploading}
                  >
                    <ImageIcon size={14} />
                    <span>{thumbFile ? 'Change Thumbnail' : 'Choose Image'}</span>
                  </button>
                  {thumbFile && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>{thumbFile.name}</span>
                  )}
                </div>
                <input
                  type="file"
                  ref={thumbInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setThumbFile(e.target.files[0]);
                    }
                  }}
                  disabled={uploading}
                />
                <span className="form-hint">Cloudinary will auto-generate one if left blank.</span>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Publishing Visibility</label>
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setStatus('published')}
                    className={`chip-btn ${status === 'published' ? 'active' : ''}`}
                    disabled={uploading}
                  >
                    <Eye size={13} />
                    <span>Published</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('draft')}
                    className={`chip-btn ${status === 'draft' ? 'active' : ''}`}
                    disabled={uploading}
                  >
                    <FileCheck size={13} />
                    <span>Draft</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Upload Progress Bar */}
            {uploading && (
              <div className="upload-progress-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {uploadProgress < 100
                      ? `Uploading to Server (${uploadProgress}%)...`
                      : 'Streaming & Optimizing on Cloud Storage...'}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                    {uploadProgress}%
                  </span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <Link to="/profile" className="btn btn-secondary" disabled={uploading}>
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploading || !videoFile || !title.trim()}
              >
                {uploading ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Uploading ({uploadProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    <span>Publish Video</span>
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

export default UploadVideoPage;
