"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forwardRef, useState } from "react";

interface IbanInputProps {
  ibanValue: string;
  bicValue: string;
  bankNameValue: string;
  onIbanChange: (value: string) => void;
  onBicChange: (value: string) => void;
  onBankNameChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

// French bank codes mapping (first 5 digits after FR and check digits)
const FRENCH_BANKS: Record<string, { name: string; bic: string }> = {
  "30004": { name: "BNP Paribas", bic: "BNPAFRPP" },
  "30002": { name: "Société Générale", bic: "SOGEFRPP" },
  "30003": { name: "Crédit Agricole", bic: "AGRIFRPP" },
  "30006": { name: "Groupe Crédit du Nord", bic: "NORDFRPP" },
  "30007": { name: "Banque Populaire", bic: "CCBPFRPP" },
  "10107": { name: "Banque Populaire", bic: "CCBPFRPP" },
  "30066": { name: "LCL", bic: "CRLYFRPP" },
  "17515": { name: "LCL", bic: "CRLYFRPP" },
  "11315": { name: "Crédit Mutuel", bic: "CMCIFRPP" },
  "12739": { name: "La Banque Postale", bic: "PSSTFRPP" },
  "20041": { name: "La Banque Postale", bic: "PSSTFRPP" },
  "13335": { name: "Caisse d'Épargne", bic: "CEPAFRPP" },
  "15589": { name: "Caisse d'Épargne", bic: "CEPAFRPP" },
  "30056": { name: "Boursorama Banque", bic: "BOUSFRPP" },
  "16958": { name: "ING Direct", bic: "INGBFRPP" },
  "17569": { name: "HSBC France", bic: "CCFRFRPP" },
  "18706": { name: "Monabanq", bic: "CMCIFRPP" },
  "13483": { name: "Fortuneo Banque", bic: "FTNOFRP1" },
  "10096": { name: "Hello bank!", bic: "BNPAFRPP" },
  "30788": { name: "CIC", bic: "CMCIFRPP" },
};

export const IbanInput = forwardRef<HTMLDivElement, IbanInputProps>(
  (
    {
      ibanValue,
      bicValue,
      bankNameValue,
      onIbanChange,
      onBicChange,
      onBankNameChange,
      required = false,
      disabled = false,
    },
    ref,
  ) => {
    const [displayIban, setDisplayIban] = useState(ibanValue);

    const formatIban = (input: string) => {
      // Remove all non-alphanumeric characters
      const clean = input.replace(/[^A-Z0-9]/gi, "").toUpperCase();

      // Format with spaces every 4 characters
      let formatted = "";
      for (let i = 0; i < clean.length && i < 27; i++) {
        if (i > 0 && i % 4 === 0) {
          formatted += " ";
        }
        formatted += clean[i];
      }

      return formatted;
    };

    const detectBankFromIban = (iban: string) => {
      const clean = iban.replace(/\s/g, "");

      // Check if it's a French IBAN (starts with FR)
      if (!clean.startsWith("FR") || clean.length < 9) {
        return null;
      }

      // Extract bank code (characters 4-8, after FR and 2 check digits)
      const bankCode = clean.substring(4, 9);

      return FRENCH_BANKS[bankCode] || null;
    };

    const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const clean = input.replace(/[^A-Z0-9]/gi, "").toUpperCase();

      // Update the raw value
      onIbanChange(clean);

      // Update the display value (formatted)
      setDisplayIban(formatIban(input));

      // Detect bank info when enough characters are entered
      if (clean.length >= 9) {
        const bankInfo = detectBankFromIban(clean);
        if (bankInfo) {
          onBicChange(bankInfo.bic);
          onBankNameChange(bankInfo.name);
        }
      }
    };

    const handleBlur = () => {
      setDisplayIban(formatIban(ibanValue));
    };

    return (
      <div ref={ref} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="iban">
            IBAN {required && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id="iban"
            placeholder="FR76 1234 5678 9012 3456 7890 123"
            value={displayIban}
            onChange={handleIbanChange}
            onBlur={handleBlur}
            maxLength={34}
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bic">
              BIC {required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="bic"
              placeholder="BNPAFRPP"
              value={bicValue}
              onChange={(e) => onBicChange(e.target.value.toUpperCase())}
              maxLength={11}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">
              Nom de la banque{" "}
              {required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="bankName"
              placeholder="BNP Paribas"
              value={bankNameValue}
              onChange={(e) => onBankNameChange(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    );
  },
);

IbanInput.displayName = "IbanInput";
