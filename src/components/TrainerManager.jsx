import React, { useState } from 'react';
import { Trash2, Plus, ArrowRight } from 'lucide-react';

const TrainerManager = ({ trainers, onAdd, onRemove, topics = {} }) => {
    const [newTrainer, setNewTrainer] = useState({
        name: '',
        type: 'Technical',
        topic: '',
        isMultiTopic: false,
        selectedTopics: [], // Array of { name: string, days: number }
        currentTopicDays: 1 // Duration for the topic currently being added
    });

    const handleAdd = () => {
        if (newTrainer.name) {
            const trainerToAdd = {
                ...newTrainer,
                id: Date.now(),
                // If single topic, ensure it's set correctly
                topic: newTrainer.isMultiTopic ? '' : newTrainer.topic
            };

            // Validation
            if (newTrainer.isMultiTopic && newTrainer.selectedTopics.length === 0) {
                alert("Please select at least one topic for multi-topic trainer");
                return;
            }
            if (!newTrainer.isMultiTopic && !newTrainer.topic) {
                alert("Please select a topic");
                return;
            }

            onAdd(trainerToAdd);
            setNewTrainer({
                name: '',
                type: 'Technical',
                topic: '',
                isMultiTopic: false,
                selectedTopics: [],
                currentTopicDays: 1
            });
        }
    };

    const addTopic = () => {
        if (newTrainer.topic) {
            setNewTrainer({
                ...newTrainer,
                selectedTopics: [...newTrainer.selectedTopics, { name: newTrainer.topic, days: newTrainer.currentTopicDays }],
                topic: '',
                currentTopicDays: 1 // Reset days to default
            });
        }
    };

    const removeTopic = (indexToRemove) => {
        setNewTrainer({
            ...newTrainer,
            selectedTopics: newTrainer.selectedTopics.filter((_, idx) => idx !== indexToRemove)
        });
    };

    // Get available topics for the selected trainer type
    const getAvailableTopics = () => {
        return topics[newTrainer.type] || [];
    };

    return (
        <div className="card">
            <h2 className="section-title">Trainer Details</h2>

            <div className="add-trainer-form">
                <div className="form-group">
                    <label>Trainer Name</label>
                    <input
                        type="text"
                        value={newTrainer.name}
                        onChange={(e) => setNewTrainer({ ...newTrainer, name: e.target.value })}
                        placeholder="Name"
                        className="input-field"
                    />
                </div>

                <div className="form-group">
                    <label>Type</label>
                    <select
                        value={newTrainer.type}
                        onChange={(e) => setNewTrainer({
                            ...newTrainer,
                            type: e.target.value,
                            topic: '',
                            selectedTopics: []
                        })}
                        className="input-field"
                    >
                        <option value="Technical">Technical</option>
                        <option value="Aptitude">Aptitude</option>
                        <option value="Verbal">Verbal</option>
                        <option value="Logical Reasoning">Logical Reasoning</option>
                    </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={newTrainer.isMultiTopic}
                                onChange={(e) => setNewTrainer({ ...newTrainer, isMultiTopic: e.target.checked })}
                            />
                            Handle Multiple Topics (Rotation)
                        </label>
                    </div>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>{newTrainer.isMultiTopic ? 'Add Topics to Rotation Cycle' : 'Topic'}</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <input
                                type="text"
                                value={newTrainer.topic}
                                onChange={(e) => setNewTrainer({ ...newTrainer, topic: e.target.value })}
                                placeholder={getAvailableTopics().length > 0 ? "Select or type a topic" : "Upload topics first"}
                                className="input-field"
                                list="topic-suggestions"
                                disabled={getAvailableTopics().length === 0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newTrainer.isMultiTopic) {
                                        e.preventDefault();
                                        addTopic();
                                    }
                                }}
                            />
                            <datalist id="topic-suggestions">
                                {getAvailableTopics().map((topic, idx) => (
                                    <option key={idx} value={topic} />
                                ))}
                            </datalist>
                        </div>

                        {newTrainer.isMultiTopic && (
                            <div style={{ width: '100px' }}>
                                <label style={{ fontSize: '0.8rem', marginBottom: '0.2rem', display: 'block' }}>Duration (Days)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newTrainer.currentTopicDays}
                                    onChange={(e) => setNewTrainer({ ...newTrainer, currentTopicDays: parseInt(e.target.value) || 1 })}
                                    className="input-field"
                                />
                            </div>
                        )}

                        {newTrainer.isMultiTopic && (
                            <button onClick={addTopic} className="btn btn-secondary" type="button" style={{ marginBottom: '2px' }}>
                                <Plus size={18} />
                            </button>
                        )}
                    </div>

                    {newTrainer.isMultiTopic && newTrainer.selectedTopics.length > 0 && (
                        <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Rotation Cycle:</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                                {newTrainer.selectedTopics.map((t, idx) => (
                                    <React.Fragment key={idx}>
                                        {idx > 0 && <ArrowRight size={14} style={{ color: 'var(--text-secondary)' }} />}
                                        <span className="badge badge-technical" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>{t.name}</span>
                                            <span style={{ opacity: 0.7, fontSize: '0.85em' }}>({t.days}d)</span>
                                            <button onClick={() => removeTopic(idx)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, marginLeft: '0.25rem' }}>
                                                <Trash2 size={12} />
                                            </button>
                                        </span>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    )}

                    {getAvailableTopics().length === 0 && (
                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                            Upload topics for {newTrainer.type} in Topic Management section
                        </small>
                    )}
                </div>

                <button onClick={handleAdd} className="btn btn-primary" style={{ marginTop: '1rem', gridColumn: '1 / -1' }}>
                    <Plus size={18} /> Add Trainer
                </button>
            </div>

            <div className="trainer-list">
                {trainers.length > 0 ? (
                    <table className="trainer-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Topics / Rotation</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trainers.map((trainer) => (
                                <tr key={trainer.id}>
                                    <td>{trainer.name}</td>
                                    <td>
                                        <span className={`badge badge-${trainer.type.toLowerCase().replace(' ', '-')}`}>
                                            {trainer.type}
                                        </span>
                                    </td>
                                    <td>
                                        {trainer.isMultiTopic ? (
                                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                {trainer.selectedTopics.map((t, idx) => (
                                                    <React.Fragment key={idx}>
                                                        {idx > 0 && <ArrowRight size={12} style={{ color: 'var(--text-secondary)' }} />}
                                                        <span style={{ fontSize: '0.9rem' }}>
                                                            {t.name} <b>({t.days}d)</b>
                                                        </span>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        ) : (
                                            trainer.topic || '-'
                                        )}
                                    </td>
                                    <td>
                                        <button onClick={() => onRemove(trainer.id)} className="btn-icon danger">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="empty-state">No trainers added yet.</p>
                )}
            </div>
        </div>
    );
};

export default TrainerManager;
