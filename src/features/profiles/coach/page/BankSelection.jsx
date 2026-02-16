import { Autocomplete, TextField, createFilterOptions } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";

const filter = createFilterOptions({
    stringify: (option) => `${option.shortName ?? ""} ${option.name ?? ""} ${option.code ?? ""}`,
});

/**
 *
 * @param {function} onBankBinChange - Callback function to receive selected bank BIN
 *
 * */
function BankSelection({ onBankBinChange, valueBin }) {
    const [banks, setBanks] = useState([]);
    const [selectedBank, setSelectedBank] = useState(null);

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

    // Preselect bank by BIN when provided and list is loaded
    useEffect(() => {
        if (!valueBin || !banks?.length) return;
        const found = banks.find((b) => String(b.bin) === String(valueBin));
        setSelectedBank(found ?? null);
    }, [valueBin, banks]);

    const handleChange = (event, value) => {
        setSelectedBank(value);
        onBankBinChange && onBankBinChange(value ? value.bin : "");
    };

    return (
        <Autocomplete
            options={banks}
            filterOptions={filter}
            value={selectedBank}
            onChange={handleChange}
            getOptionLabel={(bank) => bank?.name || ""}
            renderInput={(params) => (
                <TextField {...params} label="Select Bank" placeholder="Search name or code..." fullWidth />
            )}
            isOptionEqualToValue={(option, value) => option.bin === value.bin}
        />
    );
}

export default BankSelection;
