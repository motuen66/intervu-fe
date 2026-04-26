import { testEndPoints } from "../services/testApi";
import { useParams } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import CreateUserModal from "./CreateUserModal";
import { useState } from "react";
import useQueryApi from "../../../common/hooks/useQueryApi";
import { PrimaryButton } from "../../../common/components/buttons";

function Test() {
    const { id } = useParams();
    const [openModal, setOpenModal] = useState(false);
    const {
        data: profileData,
        error: getProfileError,
        loading: getProfileLoading,
    } = useQueryApi({
        endPoint: testEndPoints.GET_PROFILE_API,
        displaySuccessMessage: true,
        param: {
            id: id,
            alo: "ALoooo",
        },
        trigger: true,
    });

    if (getProfileLoading) {
        return <CircularProgress size={50} />;
    }

    // return minimal UI so this is a valid React component
    return profileData ? (
        <div>
            <PrimaryButton onClick={() => setOpenModal(true)}>
                Create user
            </PrimaryButton>
            <CreateUserModal open={openModal} onClose={() => setOpenModal(false)} onSuccess={() => {}} />
            <h1>Profile ID: {id}</h1>
            {profileData && <pre>{JSON.stringify(profileData, null, 2)}</pre>}
            {getProfileError && <p style={{ color: "red" }}>Error: {getProfileError.message}</p>}
        </div>
    ) : (
        <div>Not found</div>
    );
}

export default Test;
