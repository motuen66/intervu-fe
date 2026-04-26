import { Autocomplete, createFilterOptions } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";
import FormTextField from "../../../../common/components/form/FormTextField";

const filter = createFilterOptions({
    stringify: (option) => `${option.shortName ?? ""} ${option.name ?? ""} ${option.code ?? ""}`,
});

/**
 *
 * @param {function} onBankBinChange - Callback function to receive selected bank BIN
 *
 * */
function BankSelection({ selectedBin, valueBin, accountNumber, onChange, onBankBinChange }) {
    const [banks, setBanks] = useState([]);
    const [selectedBank, setSelectedBank] = useState(null);
    const [localAccount, setLocalAccount] = useState(accountNumber || "");

    useEffect(() => {
        fetchBanks();
    }, []);

    const fetchBanks = async () => {
        try {
            const res = await axios.get("https://api.vietqr.io/v2/banks");
            setBanks(res.data.data);
        } catch (error) {
            console.error("Error fetching banks:", error);
        }
    };

    const actualBin = selectedBin || valueBin;

    // Preselect bank by BIN when provided and list is loaded
    useEffect(() => {
        if (!actualBin || !banks?.length) return;
        const found = banks.find((b) => String(b.bin) === String(actualBin));
        setSelectedBank(found ?? null);
    }, [actualBin, banks]);

    useEffect(() => {
        setLocalAccount(accountNumber || "");
    }, [accountNumber]);

    const handleBankChange = (event, value) => {
        setSelectedBank(value);
        const newBin = value ? value.bin : "";
        if (onBankBinChange) onBankBinChange(newBin);
        if (onChange) onChange({ bin: newBin, accountNumber: localAccount });
    };

    const handleAccountChange = (e) => {
        const val = e.target.value;
        setLocalAccount(val);
        const currentBin = selectedBank ? selectedBank.bin : "";
        if (onChange) onChange({ bin: currentBin, accountNumber: val });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Autocomplete
                options={banks}
                filterOptions={filter}
                value={selectedBank}
                onChange={handleBankChange}
                getOptionLabel={(bank) => bank?.short_name || ""}
                renderInput={(params) => (
                    <FormTextField {...params} label="Select Bank" placeholder="Search name or code..." fullWidth />
                )}
                isOptionEqualToValue={(option, value) => option.bin === value.bin}
            />
            <FormTextField
                label="Account Number"
                fullWidth
                value={localAccount}
                onChange={handleAccountChange}
                placeholder="Enter your bank account number"
            />
        </div>
    );
}

export default BankSelection;
