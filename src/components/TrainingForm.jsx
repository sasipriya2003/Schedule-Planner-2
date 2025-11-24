import React from 'react';

const TrainingForm = ({ config, onChange }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange({ ...config, [name]: value });
    };

    return (
        <div className="card">
            <h2 className="section-title">Training Details</h2>
            <div className="form-grid">
                <div className="form-group">
                    <label>Training Name</label>
                    <input
                        type="text"
                        name="trainingName"
                        value={config.trainingName}
                        onChange={handleChange}
                        placeholder="Enter Training Name"
                        className="input-field"
                    />
                </div>

                <div className="form-group">
                    <label>Training Type</label>
                    <select
                        name="trainingType"
                        value={config.trainingType}
                        onChange={handleChange}
                        className="input-field"
                    >
                        <option value="Technical">Technical</option>
                        <option value="Mixed">Mixed</option>
                        <option value="Non-Technical">Non-Technical</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Number of Batches</label>
                    <input
                        type="number"
                        name="batches"
                        value={config.batches}
                        onChange={handleChange}
                        min="1"
                        className="input-field"
                    />
                </div>

                <div className="form-group">
                    <label>Number of Training Days</label>
                    <input
                        type="number"
                        name="days"
                        value={config.days}
                        onChange={handleChange}
                        min="1"
                        className="input-field"
                    />
                </div>

                <div className="form-group">
                    <label>Sessions Per Day</label>
                    <input
                        type="number"
                        name="sessionsPerDay"
                        value={config.sessionsPerDay}
                        onChange={handleChange}
                        min="1"
                        className="input-field"
                    />
                </div>
            </div>
        </div>
    );
};

export default TrainingForm;
