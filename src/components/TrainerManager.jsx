import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

const TrainerManager = ({ trainers, onAdd, onRemove, topics = {} }) => {
    const [newTrainer, setNewTrainer] = useState({
        name: '',
        type: 'Technical',
        topic: ''
    });

    const handleAdd = () => {
        if (newTrainer.name) {
            onAdd({ ...newTrainer, id: Date.now() });
            setNewTrainer({ ...newTrainer, name: '', topic: '' });
        }
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
                        onChange={(e) => setNewTrainer({ ...newTrainer, type: e.target.value, topic: '' })}
                        className="input-field"
                    >
                        <option value="Technical">Technical</option>
                        <option value="Aptitude">Aptitude</option>
                        <option value="Verbal">Verbal</option>
                        <option value="Logical Reasoning">Logical Reasoning</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Topic</label>
                    <input
                        type="text"
                        value={newTrainer.topic}
                        onChange={(e) => setNewTrainer({ ...newTrainer, topic: e.target.value })}
                        placeholder={getAvailableTopics().length > 0 ? "Select or type a topic" : "Upload topics first"}
                        className="input-field"
                        list="topic-suggestions"
                        disabled={getAvailableTopics().length === 0}
                    />
                    <datalist id="topic-suggestions">
                        {getAvailableTopics().map((topic, idx) => (
                            <option key={idx} value={topic} />
                        ))}
                    </datalist>
                    {getAvailableTopics().length === 0 && (
                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                            Upload topics for {newTrainer.type} in Topic Management section
                        </small>
                    )}
                </div>

                <button onClick={handleAdd} className="btn btn-primary" style={{ marginTop: 'auto' }}>
                    <Plus size={18} /> Add
                </button>
            </div>

            <div className="trainer-list">
                {trainers.length > 0 ? (
                    <table className="trainer-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Topic</th>
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
                                    <td>{trainer.topic || '-'}</td>
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
