import { Outlet } from "react-router-dom";
import SuspendedGate from "../../common/components/SuspendedGate";

function EmptyLayout() {
    return (
        <SuspendedGate>
            <Outlet />
        </SuspendedGate>
    );
}

export default EmptyLayout;
