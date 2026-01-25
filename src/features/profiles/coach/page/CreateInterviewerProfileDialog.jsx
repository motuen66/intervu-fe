import { Avatar, Dialog, Grid, TextField, Typography, Button } from "@mui/material";
import { useMemo, useState } from "react";
import { interviewerProfileEndPoints } from "../service/coachProfileApi";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";

function CreateInterviewerProfileDialog({ open, onClose }) {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        role: 1, //Interviewer
        profilePicture: "",
        status: 0, //Active
        currentAmount: 0, //Interviewer update later
        experienceYears: 0,
        statusProfile: 0, //Enable
        companyIds: [],
        skillIds: [],
    });

    const endpoint = useMemo(() => interviewerProfileEndPoints.CREATE_INTERVIEWER_PROFILE, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleArrayChange = (field, e) => {
        setForm({
            ...form,
            [field]: e.target.value.split(",").map((x) => Number(x.trim())),
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let { success, data, message } = await callApi({
                method: METHOD.POST,
                endpoint,
                arg: form,
            });

            if (!success) {
                console.error("Failed to create interviewer profile:", message);
                return;
            }

            data = JSON.parse(data);
            console.log("Created profile:", data);
            onClose();
        } catch (err) {
            console.error("Error creating profile:", err);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
                <Typography variant="h6" gutterBottom>
                    Create New Interviewer
                </Typography>

                <TextField
                    label="Full Name"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    type="password"
                />
                <TextField
                    label="Profile Picture URL"
                    name="profilePicture"
                    value={form.profilePicture}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Experience Years"
                    name="experienceYears"
                    type="number"
                    value={form.experienceYears}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />

                <TextField
                    label="Company Ids (comma separated)"
                    value={form.companyIds.join(",")}
                    onChange={(e) => handleArrayChange("companyIds", e)}
                    fullWidth
                    margin="normal"
                />

                <TextField
                    label="Skill Ids (comma separated)"
                    value={form.skillIds.join(",")}
                    onChange={(e) => handleArrayChange("skillIds", e)}
                    fullWidth
                    margin="normal"
                />

                <Button type="submit" variant="contained" color="primary" style={{ marginTop: 16 }}>
                    Create Profile
                </Button>
            </form>
        </Dialog>
    );
}

export default CreateInterviewerProfileDialog;
