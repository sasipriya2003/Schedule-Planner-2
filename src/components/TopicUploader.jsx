import React, { useState } from 'react';
import { Upload, Trash2, FileText } from 'lucide-react';
import { extractTopics } from '../utils/topicParser';

const TopicUploader = ({ topics, onTopicsUpdate }) => {
    const [selectedType, setSelectedType] = useState('Aptitude');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const trainerTypes = ['Aptitude', 'Logical Reasoning', 'Verbal'];

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        setIsUploading(true);
        setUploadError('');

        try {
            const extractedTopics = await extractTopics(files);

            // Merge with existing topics for this type
            const existingTopics = topics[selectedType] || [];
            const mergedTopics = [...new Set([...existingTopics, ...extractedTopics])];

            onTopicsUpdate({
                ...topics,
                [selectedType]: mergedTopics
            });

            // Reset file input
            event.target.value = '';
        } catch (error) {
            setUploadError(`Error uploading files: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleClearType = (type) => {
        const updatedTopics = { ...topics };
        delete updatedTopics[type];
        onTopicsUpdate(updatedTopics);
    };

    const getTotalTopicCount = () => {
        return Object.values(topics).reduce((sum, topicList) => sum + topicList.length, 0);
    };

    return (
        <div className="card">
            <h2 className="section-title">Topic Management</h2>

            <div className="topic-upload-section">
                <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
                    <div className="form-group">
                        <label>Trainer Type</label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="input-field"
                        >
                            {trainerTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Upload Files</label>
                        <label className="file-upload-btn">
                            <input
                                type="file"
                                multiple
                                accept=".txt,.csv,.xlsx,.xls"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                                style={{ display: 'none' }}
                            />
                            <span className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                <Upload size={18} />
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </span>
                        </label>
                    </div>
                </div>

                {uploadError && (
                    <div className="error-message" style={{ marginTop: '1rem' }}>
                        {uploadError}
                    </div>
                )}

                <div className="file-format-hint">
                    <FileText size={16} />
                    <span>Supported formats: .txt, .csv, .xlsx, .xls</span>
                </div>
            </div>

            {getTotalTopicCount() > 0 && (
                <div className="topics-display">
                    <h3 className="subsection-title">Uploaded Topics ({getTotalTopicCount()} total)</h3>

                    <div className="topics-grid">
                        {trainerTypes.map(type => {
                            const typeTopics = topics[type] || [];
                            if (typeTopics.length === 0) return null;

                            return (
                                <div key={type} className="topic-card">
                                    <div className="topic-card-header">
                                        <h4>
                                            <span className={`badge badge-${type.toLowerCase().replace(' ', '-')}`}>
                                                {type}
                                            </span>
                                            <span className="topic-count">{typeTopics.length} topics</span>
                                        </h4>
                                        <button
                                            onClick={() => handleClearType(type)}
                                            className="btn-icon danger"
                                            title="Clear all topics"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="topic-list">
                                        {typeTopics.slice(0, 5).map((topic, idx) => (
                                            <div key={idx} className="topic-item">
                                                • {topic}
                                            </div>
                                        ))}
                                        {typeTopics.length > 5 && (
                                            <div className="topic-item more-topics">
                                                + {typeTopics.length - 5} more topics...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {getTotalTopicCount() === 0 && (
                <p className="empty-state">No topics uploaded yet. Select a trainer type and upload files to get started.</p>
            )}
        </div>
    );
};

export default TopicUploader;
