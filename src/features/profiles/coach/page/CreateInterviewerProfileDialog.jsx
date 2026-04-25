import { Box, Dialog, Stack } from "@mui/material";
import { useMemo, useState } from "react";
import { interviewerProfileEndPoints } from "../service/coachProfileApi";
import { callApi } from "../../../../common/utils/apiConnector";
import { METHOD } from "../../../../common/constants/api";
import FormTextField from "../../../../common/components/form/FormTextField";
import { PrimaryButton } from "../../../../common/components/buttons";
import SectionHeading from "../../../../common/components/SectionHeading";

function CreateInterviewerProfileDialog({ open, onClose }) {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        role: 1, //Interviewer
        profilePicture: "",
        status: 0, //Active
        currentAmount: 0, //Interviewer update later
        experienceYears: "",
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
                arg: {
                    ...form,
                    experienceYears: Number(form.experienceYears || 0),
                },
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
            <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
                <SectionHeading title="Create New Interviewer" as="h2" />

                <Stack spacing={2}>
                    <FormTextField label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} fullWidth />
                    <FormTextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth />
                    <FormTextField
                        label="Password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        fullWidth
                        type="password"
                    />
                    <FormTextField
                        label="Profile Picture URL"
                        name="profilePicture"
                        value={form.profilePicture}
                        onChange={handleChange}
                        fullWidth
                    />
                    <FormTextField
                        label="Experience Years"
                        name="experienceYears"
                        type="number"
                        value={form.experienceYears}
                        onChange={handleChange}
                        fullWidth
                    />
                    <FormTextField
                        label="Company Ids (comma separated)"
                        value={form.companyIds.join(",")}
                        onChange={(e) => handleArrayChange("companyIds", e)}
                        fullWidth
                    />
                    <FormTextField
                        label="Skill Ids (comma separated)"
                        value={form.skillIds.join(",")}
                        onChange={(e) => handleArrayChange("skillIds", e)}
                        fullWidth
                    />
                    <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
                        <PrimaryButton type="submit">Create Profile</PrimaryButton>
                    </Box>
                </Stack>
            </Box>
        </Dialog>
    );
}

export default CreateInterviewerProfileDialog;
