import { useState } from "react";
import CreateInterviewerProfileDialog from "../../profiles/coach/page/CreateInterviewerProfileDialog";
import { PrimaryButton } from "../../../common/components/buttons";
import PageHeader from "../../../common/components/PageHeader";

function InterviewerManagePage() {
    const [openDialog, setOpenDialog] = useState(false);

    return (
        <>
            <PageHeader
                title="Interviewer Manage Page"
                actions={
                    <PrimaryButton onClick={() => setOpenDialog(true)}>
                        Create Interviewer
                    </PrimaryButton>
                }
            />

            <CreateInterviewerProfileDialog open={openDialog} onClose={() => setOpenDialog(false)} />
        </>
    );
}

export default InterviewerManagePage;
